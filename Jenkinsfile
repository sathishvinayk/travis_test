pipeline {
  agent any 

  stages {
    stage('Checkout') {
      steps { 
        checkout scm
      }
    }
    stage('Build') { 
      steps { 
        sh 'source ~/.bashrc && cd Central && npm install'
      }
    }
    stage('Test'){
      steps {
        sh 'source ~/.bashrc && cd Central && npm test'
      }
    }
    stage('Container'){
      steps {
        sh 'source ~/.bashrc && cd Central && sh build.sh container'
      }
    }
    stage('Deploy'){
      steps {
        sh 'source ~/.bashrc && cd Central && sh build.sh deploy'
      }
    }
  }
}
