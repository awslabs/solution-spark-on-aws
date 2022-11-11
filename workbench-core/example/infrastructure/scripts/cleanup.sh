#! /usr/bin/env bash

# set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function main(){
    while getopts :u:d:r:pitc opts; do
        case $opts in
            u) USER_POOL_ID=$OPTARG;;
            d) DYNAMO_DB_TABLE_NAME=$OPTARG;;
            r) REGION=$OPTARG;;
            p) DELETE_SSM_PARAMETERS=1;;
            i) GET_USER_POOL_ID=1;;
            t) GET_DYNAMO_DB_TABLE=1;;
            c) cleanup;;
            \?) help; exit 0;;
        esac
    done
}

function help(){
    echo "This script cleans up the resources created for integration test:
    1. Delete Cognito UserPool
    2. Delete DynamoDB Table
    3. Delete '/maf/exampleApp/rootUser/email' and '/maf/exampleApp/rootUser/password' parameters from the parameter store

Usage: `basename $0`
    -h [Help]
    -u [COGNITO USER_POOL_ID]
    -d [DELETE_DYNAMO_DB_TABLE]
    -r [AWS REGION]
    -p [DELETE_SSM_PARAMETERS]
    -i [GET_USER_POOL_ID]
    -t [GET_DYNAMO_DB_TABLE]
    -c [CLEANUP FLAG]

Example:
    Get UserPoolId:                     `basename $0` -r 'us-east-1' -i -c
    Get DynamoDBTable:                  `basename $0` -r 'us-east-1' -t -c
    Delete UserPool:                    `basename $0` -u 'us-east-1_abcde' -r 'us-east-1' -c
    Delete DynamoDB Table:              `basename $0` -d 'TABLE_NAME' -r 'us-east-1' -c
    Delete Ssm Parameter:               `basename $0` -r 'us-east-1' -p -c
    Delete All:                         `basename $0` -u 'us-east-1_abcde' -d 'TABLE_NAME' -r 'us-east-1' -p -c"
}

function check(){
    if [[ -z $REGION ]]; then
        echo -e "${RED}ERROR: REGION are mandatory arguments${NC}"
        exit 1
    fi
}

function cleanup(){
    check
    if [[ -n $USER_POOL_ID ]]; then
        ### Delete Cognito UserPool
        echo -e "${YELLOW}### Delete Cognito UserPool ###${NC}"
        aws cognito-idp delete-user-pool --user-pool-id $USER_POOL_ID --region $REGION 1> /dev/null

        if [ $? -eq 0 ]; then
        echo -e "${GREEN}*** Cognito UserPool deleted ***${NC}"
        else
            echo -e "${RED}*** [ERROR] Cognito UserPool could not be deleted ***${NC}"
        fi
    fi

    if [[ -n $DYNAMO_DB_TABLE_NAME ]]; then
        ### Delete DynamoDB Table
        echo -e "${YELLOW}### Delete DynamoDB Table ###${NC}"
        aws dynamodb delete-table --table-name $DYNAMO_DB_TABLE_NAME --region $REGION 1> /dev/null

        if [ $? -eq 0 ]; then
        echo -e "${GREEN}*** DynamoDB Table deleted ***${NC}"
        else
            echo -e "${RED}*** [ERROR] DynamoDB Table could not be deleted ***${NC}"
        fi
    fi

    if [[ -n $DELETE_SSM_PARAMETERS ]]; then
        ### Delete ssm paramters
        echo -e "${YELLOW}### Delete ssm paramters ###${NC}"
        aws ssm delete-parameters --name '/maf/exampleApp/rootUser/email' '/maf/exampleApp/rootUser/password' --region $REGION 1> /dev/null

        if [ $? -eq 0 ]; then
        echo -e "${GREEN}*** SSM paramters deleted ***${NC}"
        else
            echo -e "${RED}*** [ERROR] SSM paramters could not be deleted ***${NC}"
        fi
    fi


    if [[ -n $GET_USER_POOL_ID ]]; then
        ### Get UserPool Id
        echo -e "${YELLOW}### Get UserPool Id ###${NC}"
        Id=`aws cognito-idp list-user-pools --region $REGION --max-results 5 | jq '.UserPools[] | select(.Name == "example-app-userPool") | {Id}' | jq '.Id'`
        if [ $? -eq 0 ]; then
        echo -e "${GREEN}Id: $Id${NC}"
        else
            echo -e "${RED}*** [ERROR] Could not get the UserPool Id ***${NC}"
        fi
    fi

    if [[ -n $GET_DYNAMO_DB_TABLE ]]; then
        ### Get DynamoDB Table
        echo -e "${YELLOW}### Get DynamoDb Table ###${NC}"
        DBName=`aws dynamodb list-tables --region $REGION --max-items 4 | jq '.TableNames[]' | grep Example`
        if [ $? -eq 0 ]; then
        echo -e "${GREEN}DBName: $DBName${NC}"
        else
            echo -e "${RED}*** [ERROR] Could not get the DynamoDB Table***${NC}"
        fi
    fi
}

function sanitize() {
    # echo -e "${BLUE}Sanitizing environment variables..${NC}"
    unset USER_POOL_ID
    unset DYNAMO_DB_TABLE_NAME
    unset DELETE_SSM_PARAMETERS
    unset REGION
}

sanitize
main $@
sanitize