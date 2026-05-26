from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from database import Base
import datetime

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(String, primary_key=True, index=True)
    hostname = Column(String, index=True)
    ip_address = Column(String)
    os_type = Column(String)  # ubuntu, windows
    connection_method = Column(String) # ssh, winrm
    username = Column(String)
    password = Column(String) # In a real app, this should be encrypted/vaulted
    node_group = Column(String, default="DEFAULT LAB")
    status = Column(String, default="offline")
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String, index=True)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    os_type = Column(String)
    result = Column(Text)
    success = Column(Boolean, default=True)
