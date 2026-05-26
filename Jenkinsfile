pipeline {
    agent any

    environment {
        // Defines the docker-compose command
        DOCKER_COMPOSE = 'docker-compose'
    }

    stages {
        stage('Initialize') {
            steps {
                echo 'Starting Pipeline...'
                // Clear out unnecessary workspace artifacts if needed
                cleanWs()
                // Checkout code from Git
                checkout scm
            }
        }

        stage('Parallel Build & Test') {
            parallel {
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            echo 'Building the Frontend UI...'
                            // Assuming Node is available on the Jenkins agent
                            // sh 'npm install'
                            // sh 'npm run build'
                            
                            // Alternatively, just build the Docker image
                            sh 'docker build -t devops-frontend:latest .'
                        }
                    }
                }
                
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            echo 'Building the Backend API...'
                            // Dependencies & Testing
                            // sh 'pip install -r requirements.txt'
                            // sh 'pytest'

                            // Build Docker image
                            sh 'docker build -t devops-backend:latest .'
                        }
                    }
                }
                
                stage('Ansible Linter') {
                    steps {
                        dir('ansible') {
                            echo 'Linting Ansible Playbooks...'
                            // sh 'ansible-lint playbooks/*.yml'
                        }
                    }
                }
            }
        }

        stage('Simulate Deploy') {
            steps {
                echo 'CI/CD Best Practice: Images built successfully!'
                echo 'Normally, we would push these images to Docker Hub or AWS ECR here.'
                // sh "docker push devops-frontend:latest"
                // sh "docker push devops-backend:latest"
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check the logs.'
            // Example: send alert to Slack or Email
            // slackSend channel: '#deployments', message: "Deployment Failed!"
        }
        always {
            echo 'Cleaning up pipeline...'
        }
    }
}
