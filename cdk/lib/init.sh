#! /bin/bash
# become root user
sudo su

# update dependencies
yum -y update

sudo yum install amazon-cloudwatch-agent