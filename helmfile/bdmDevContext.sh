#!/bin/bash
az account set -s EsDBDMDECDSub
export SUBSCRIPTION_ID=$(az account show --subscription "EsDBDMDECDSub" --query 'id' -o tsv)
export TENANT_ID=$(az account show --subscription "EsDBDMDECDSub" --query 'homeTenantId' -o tsv)
export KEYVAULT_NAME=bdmDevDPSKeyVault
export KEYVAULT_READ_USER=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name bdm-dev-terraform-sp-id --query value -otsv)
export KEYVAULT_READ_PASSWORD=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name bdm-dev-terraform-sp-pass --query value -otsv)
export K8S_CLUSTER_NAME=ESdCDPSBDMK8SDev-K8S
export K8S_RG_NAME=ESdCDPSBDMK8SDev
export BASE_DOMAIN=bdm-dev.dts-stn.com
export PROJECT=dts-va-address-skill
export BRANCH=develop
export RBAC_TEAM_ID=$(az ad group show --group bdm-dps-fujitsu-si --query 'objectId' -o tsv)
az aks get-credentials --name $K8S_CLUSTER_NAME --resource-group $K8S_RG_NAME
