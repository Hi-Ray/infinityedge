pipeline {
  agent any
  stages {
    stage('Testing') {
      steps {
        sh '''npm i -g yarn
'''
        sh 'yarn'
        sh 'yarn test'
      }
    }

    stage('Linting') {
      steps {
        sh 'yarn'
        sh 'yarn lint-test'
      }
    }

  }
}