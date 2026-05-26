# Multi-OS Lab System

This project is a centralized management system for a multi-OS lab environment. It includes a FastAPI backend, a React frontend, Ansible playbooks for deployment/configuration, and monitoring using Prometheus and Grafana, all orchestrated via Docker Compose.

## Project Structure

- `ansible/`: Ansible configurations, inventory, and playbooks for deploying and managing the multi-OS lab nodes (Ubuntu and Windows).
- `backend/`: FastAPI application server. Contains API routes, database models, and service logic.
- `frontend/`: React frontend application built with Vite and styled with Tailwind CSS.
- `monitoring/`: Configuration for Prometheus and Grafana to monitor the infrastructure and applications.
- `docker-compose.yml`: Docker Compose configuration to spin up the backend, frontend, and monitoring services.

## Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend development)
- Python 3 (for local backend development)
- Ansible (for managing lab nodes)

## Getting Started

### Using Docker Compose (Recommended)

To start the entire stack (Frontend, Backend, Prometheus, Grafana) using Docker Compose, run:

```bash
docker-compose up -d --build
```

### Ansible Playbooks

The `ansible/playbooks/` directory contains playbooks to manage the lab infrastructure:
- `deploy_ai_lab.yml` / `deploy_ai_lab_ubuntu.yml`
- `install_python_windows.yml`
- `reboot_ubuntu.yml` / `reboot_windows.yml`
- `restart_service_ubuntu.yml` / `restart_service_windows.yml`

Ensure your `ansible/inventory/hosts.ini` is properly configured before running the playbooks.

### Local Development

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License.
