from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import subprocess
import os

app = FastAPI(title="DevOps Lab Automation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock database for nodes

db_nodes = [
    {
        "node_id": "labubuntu",
        "hostname": "LAB-UBUNTU",
        "os": "ubuntu",
        "ip": "192.168.1.101",
        "connection": "ssh",
        "status": "online",
        "cpu": "32%",
        "ram": "48%"
    },
    {
        "node_id": "friendpc",
        "hostname": "FRIEND-PC",
        "os": "windows",
        "ip": "192.168.1.120",
        "connection": "winrm",
        "status": "online",
        "cpu": "44%",
        "ram": "61%"
    }
]

# Mock database for history
deployment_history = []

class RegisterNodeRequest(BaseModel):
    hostname: str
    ip: str
    os_type: str
    credentials: str
    connection_method: str

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
    return {"message": "Welcome to the DevOps Lab Automation API"}

@app.get("/nodes")
def get_nodes():
    return {"nodes": db_nodes}

@app.post("/register")
def register_node(req: RegisterNodeRequest):
    new_node = {
        "node_id": req.hostname.lower().replace("-", ""),
        "hostname": req.hostname,
        "os": req.os_type.lower(),
        "ip": req.ip,
        "connection": req.connection_method.lower(),
        "status": "offline",
        "cpu": "0%",
        "ram": "0%"
    }
    db_nodes.append(new_node)
    return {"message": "Node registered successfully", "node": new_node}

def run_ansible_playbook(playbook_path: str, target: str, extra_vars: dict = None):
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

def record_history(node_id: str, action: str, os_type: str):
    import datetime
    deployment_history.append({
        "node_id": node_id,
        "action": action,
        "timestamp": datetime.datetime.now().isoformat(),
        "os_type": os_type,
        "result": "Pending"
    })

@app.post("/deploy")
def deploy_task(req: DeployRequest, background_tasks: BackgroundTasks):
    node = next((n for n in db_nodes if n["node_id"] == req.node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    os_type = node["os"]
    
    # Map tasks to playbooks
    playbook_file = f"/ansible/playbooks/{req.task}_{os_type}.yml"

    record_history(req.node_id, req.task, os_type)
    background_tasks.add_task(run_ansible_playbook, playbook_file, req.node_id)
    
    return {"status": "Deployment started", "node": req.node_id, "task": req.task, "playbook": playbook_file}

@app.post("/reboot")
def reboot_node(req: RebootRequest, background_tasks: BackgroundTasks):
    node = next((n for n in db_nodes if n["node_id"] == req.node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    os_type = node["os"]
    if os_type == "windows":
        playbook_file = "/ansible/playbooks/reboot_windows.yml"
    else:
        # Assuming you'd create a reboot_ubuntu.yml
        playbook_file = "/ansible/playbooks/reboot_ubuntu.yml"

    record_history(req.node_id, "reboot", os_type)
    background_tasks.add_task(run_ansible_playbook, playbook_file, req.node_id)
    
    return {"status": "Reboot started", "node": req.node_id}

@app.post("/restart-service")
def restart_service(req: RestartServiceRequest, background_tasks: BackgroundTasks):
    node = next((n for n in db_nodes if n["node_id"] == req.node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    os_type = node["os"]
    playbook_file = f"/ansible/playbooks/restart_service_{os_type}.yml"

    record_history(req.node_id, f"restart service {req.service_name}", os_type)
    background_tasks.add_task(run_ansible_playbook, playbook_file, req.node_id, {"service_name": req.service_name})
    
    return {"status": "Service restart started", "node": req.node_id, "service": req.service_name}

@app.get("/deployment-history")
def get_deployment_history():
    return {"history": deployment_history}

