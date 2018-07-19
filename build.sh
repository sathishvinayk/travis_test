#!/bin/bash
source ~/.bashrc

GITSHA=$(git rev-parse --short HEAD)

case "$1" in
  container)
    sudo -u sathish docker build -t central:$GITSHA .
    sudo -u sathish docker tag central:$GITSHA sathishvinayk/central:$GITSHA 
    sudo -i -u sathish docker push sathishvinayk/central:$GITSHA 
  ;;
  deploy)
    sed -e s/_NAME_/central/ -e s/_PORT_/3000/  < ../deployment/service-template.yml > svc.yml
    sed -e s/_NAME_/central/ -e s/_PORT_/3000/ -e s/_IMAGE_/sathishvinayk\\/central:$GITSHA/ < ../deployment/deployment-template.yml > dep.yml
    sudo -i -u sathish kubectl apply -f $(pwd)/svc.yml
    sudo -i -u sathish kubectl apply -f $(pwd)/dep.yml
  ;;
  *)
    echo 'invalid build command'
    exit 1
  ;;
esac

