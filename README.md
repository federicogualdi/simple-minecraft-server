# simple-minecraft-server

## Work In Progress

The goal of this project is to provide in one fell swoop an already configured and ready-to-use Minecraft server deployed on an AWS EC2 server through CDK.

# Deploy
Synthetize
```
cdk synth --profile $AWS_PROFILE
```
Deploy
```
cdk deploy --profile $AWS_PROFILE
```

# Destroy
Destroy
```
cdk destroy --profile $AWS_PROFILE
```