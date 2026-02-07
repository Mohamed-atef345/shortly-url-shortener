terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=4.59.0"
    }
  }
  
   backend "azurerm" {
    storage_account_name = "shortlytfstate"                                 
    container_name       = "tfstate"                                  
    key                  = "prod.terraform.tfstate"                   
  }
}

provider "azurerm" {
  resource_provider_registrations = "none" 
  features {}

}
