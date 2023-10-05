#!/bin/bash
# Copyright 2021 - 2023 Transflox LLC. All rights reserved.

CODENAME=movechess
AWS_REGION=ap-south-1
AWS_PROFILE=movechess

# ECR_KEY_ARN=$(aws kms create-key \
#   --profile ${AWS_PROFILE} \
#   --region ${AWS_REGION} \
#   --tags TagKey=codename,TagValue=${CODENAME} \
#   --query KeyMetadata.Arn \
#   --description "ECR Parse Key")
  
ECR_KEY_ARN=arn:aws:kms:ap-south-1:649145334474:key/33bc5173-275f-4a06-b7e3-494d03a125f9
echo ${ECR_KEY_ARN}

envs=(staging production)
services=(balue-shimmer balue hey klaytn)

for ENV_TYPE in ${envs[@]}; do
  for SERVICE in ${services[@]}; do
    aws ecr create-repository \
      --profile ${AWS_PROFILE} \
      --region ${AWS_REGION} \
      --repository-name ${CODENAME}/${ENV_TYPE}/${SERVICE} \
      --tags Key=codename,Value=${CODENAME} \
      --encryption-configuration encryptionType=KMS,kmsKey=${ECR_KEY_ARN} \
      --query repository.repositoryArn
  done
done

