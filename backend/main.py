from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import subprocess
import os
import asyncio
import paramiko
import winrm

from database import engine, Base, get_db
import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DevOps Lab Automation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NodeCreate(BaseModel):
    hostname: str
    ip_address: str
    os_type: str
    username: str
    password: str
    connection_method: str
    node_group: str = "DEFAULT LAB"

class BulkDeployRequest(BaseModel):
    node_ids: List[str]
    package_name: str
    installation_method: str # e.g. apt, pip, choco, winget, command

class DeployRequest(BaseModel):
    node_id: str
    task: str

class RestartServiceRequest(BaseModel):
    node_id: str
    service_name: str

class RebootRequest(BaseModel):
    node_id: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Hybrid DevOps Lab Automation API"}

@app.get("/nodes")
def get_nodes(db: Session = Depends(get_db)):
    nodes = db.query(models.Node).all()
    return {"nodes": nodes}

@app.post("/register")
def register_node(req: NodeCreate, db: Session = Depends(get_db)):
    node_id = req.hostname.lower().replace("-", "")
    
    # Check if node exists
    existing = db.query(models.Node).filter(models.Node.id == node_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Node already registered")

    # Perform Connection Validation
    try:
        if req.connection_method.lower() == 'ssh':
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            # Fast timeout for verification
            client.connect(hostname=req.ip_address, username=req.username, password=req.password, timeout=5)
            client.close()
        elif req.connection_method.lower() == 'winrm':
            session = winrm.Session(req.ip_address, auth=(req.username, req.password), transport='ntlm', server_cert_validation='ignore')
            r = session.run_cmd('ipconfig', ['/all'])
            if r.status_code != 0:
                raise Exception("WinRM auth failed or command returned non-zero")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connectivity validation failed: {str(e)}")
        
    new_node = models.Node(
        id=node_id,
        hostname=req.hostname,
        ip_address=req.ip_address,
        os_type=req.os_type.lower(),
        connection_method=req.connection_method.lower(),
        username=req.username,
        password=req.password,
        node_group=req.node_group,
        status="online"
    )
    db.add(new_node)
    db.commit()
    db.refresh(new_node)
    
    return {"message": "Node registered and validated successfully", "node_id": new_node.id}

def run_ansible_playbook(playbook_path: str, target: str, extra_vars: dict = None):
    # In a real implementation this should dynamically generate inventory per run based on the DB
    inventory_path = "/ansible/inventory/hosts.ini"
    cmd = [
        "ansible-playbook",
        "-i", inventory_path,
        "-l", target,
        playbook_path
    ]
    if extra_vars:
        for k, v in extra_vars.items():
            cmd.extend(["-e", f"{k}={v}"])
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"Deployment stdout: {result.stdout}")
        print(f"Deployment stderr: {result.stderr}")
    except Exception as e:
        print(f"Ansible run failed: {str(e)}")

def record_history(db: Session, node_id: str, action: str, os_type: str):
    log = models.AuditLog(
        node_id=node_id,
        action=action,
        os_type=os_type,
        result="Pending"
    )
    db.add(log)
    db.commit()

@app.post("/deploy")
def deploy_task(req: DeployRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    os_type = node.os_type
    playbook_file = f"/ansible/playbooks/{req.task}_{os_type}.yml"

    record_history(db, req.node_id, req.task, os_type)
    background_tasks.add_task(run_ansible_playbook, playbook_file, req.node_id)
    
    return {"status": "Deployment started", "node": req.node_id, "task": req.task}

@app.post("/deploy/bulk")
def bulk_deploy(req: BulkDeployRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Simple simulation: trigger tasks for each node with dynamic parameters
    for node_id in req.node_ids:
        node = db.query(models.Node).filter(models.Node.id == node_id).first()
        if not node:
            continue
            
        record_history(db, node.id, f"bulk install: {req.package_name} via {req.installation_method}", node.os_type)
        
        # Determine pseudo-playbook depending on installation method
        # In a real setup, there would be a generic dynamic playbook where we pass pkg name and method.
        # e.g., generic_install_ubuntu.yml with extra_vars={'pkg_name': req.package_name, 'method': req.installation_method}
        extra_vars = {"pkg_name": req.package_name, "method": req.installation_method}
        playbook_file = f"/ansible/playbooks/dynamic_install_{node.os_type}.yml"
        
        background_tasks.add_task(run_ansible_playbook, playbook_file, node.id, extra_vars)
        
    return {"status": "Bulk deployment started", "target_nodes": req.node_ids, "package": req.package_name}

@app.post("/reboot")
def reboot_node(req: RebootRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    os_type = node.os_type
    playbook_file = f"/ansible/playbooks/reboot_{os_type}.yml"

    record_history(db, req.node_id, "reboot", os_type)
    background_tasks.add_task(run_ansible_playbook, playbook_file, req.node_id)
    
    return {"status": "Reboot started", "node": req.node_id}

@app.post("/restart-service")
def restart_service(req: RestartServiceRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    os_type = node.os_type
    playbook_file = f"/ansible/playbooks/restart_service_{os_type}.yml"

    record_history(db, req.node_id, f"restart service {req.service_name}", os_type)
    background_tasks.add_task(run_ansible_playbook, playbook_file, req.node_id, {"service_name": req.service_name})
    
    return {"status": "Service restart started", "node": req.node_id, "service": req.service_name}

@app.get("/deployment-history")
def get_deployment_history(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(50).all()
    return {"history": logs}

@app.websocket("/ws/terminal/{node_id}")
async def terminal_endpoint(websocket: WebSocket, node_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    
    node = db.query(models.Node).filter(models.Node.id == node_id).first()
    if not node:
        await websocket.send_text("Error: Node not found.\r\n")
        await websocket.close()
        return

    await websocket.send_text(f"Connecting to {node.hostname} ({node.ip_address}) via {node.connection_method.upper()}...\r\n")
    
    if node.connection_method == 'ssh':
        # SSH Terminal logic using Paramiko
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            client.connect(hostname=node.ip_address, username=node.username, password=node.password, timeout=5)
            channel = client.invoke_shell()
            channel.settimeout(0.0)
            
            await websocket.send_text("Connected successfully.\r\n")
            
            async def receive_from_ws():
                try:
                    while True:
                        data = await websocket.receive_text()
                        channel.send(data)
                except WebSocketDisconnect:
                    pass

            async def send_to_ws():
                try:
                    while True:
                        if channel.recv_ready():
                            data = channel.recv(1024).decode('utf-8', errors='ignore')
                            await websocket.send_text(data)
                        else:
                            await asyncio.sleep(0.05)
                        
                        if channel.exit_status_ready():
                            break
                except Exception:
                    pass

            # Run loops
            task1 = asyncio.create_task(receive_from_ws())
            task2 = asyncio.create_task(send_to_ws())
            await asyncio.wait([task1, task2], return_when=asyncio.FIRST_COMPLETED)
            
        except Exception as e:
            await websocket.send_text(f"Connection failed: {str(e)}\r\n")
        finally:
            client.close()
            await websocket.close()
            
    elif node.connection_method == 'winrm':
        # WinRM simulated interactive terminal execution
        await websocket.send_text("WinRM Interactive Session Initialized.\r\n")
        await websocket.send_text("PS C:\\> ")
        
        session = winrm.Session(node.ip_address, auth=(node.username, node.password), transport='ntlm', server_cert_validation='ignore')
        current_cmd = ""
        
        try:
            while True:
                data = await websocket.receive_text()
                
                # Detect enter key (can be \r or \n depending on terminal)
                if data == '\r' or data == '\n':
                    await websocket.send_text("\r\n")
                    
                    if current_cmd.strip():
                        # Execute command
                        try:
                            # We use run_ps to execute PowerShell commands
                            r = session.run_ps(current_cmd.strip())
                            
                            if r.std_out:
                                await websocket.send_text(r.std_out.decode('utf-8', errors='ignore').replace('\n', '\r\n'))
                            if r.std_err:
                                await websocket.send_text(r.std_err.decode('utf-8', errors='ignore').replace('\n', '\r\n'))
                                
                        except Exception as cmd_e:
                            await websocket.send_text(f"Error executing command: {str(cmd_e)}\r\n")
                    
                    # Reset command buffer and show prompt
                    current_cmd = ""
                    await websocket.send_text("PS C:\\> ")
                
                # Handle backspace (Backspace is \x7f, Delete is \x08)
                elif data == '\x7f' or data == '\x08':
                    if len(current_cmd) > 0:
                        current_cmd = current_cmd[:-1]
                        # Send backspace, space, backspace to visually erase character
                        await websocket.send_text("\b \b")
                        
                # Handle regular text
                else:
                    current_cmd += data
                    await websocket.send_text(data)

        except WebSocketDisconnect:
            pass

