resource "azurerm_resource_group" "shortly" {
  name     = "shortly-prod"
  location = "West Europe"
}

resource "azurerm_kubernetes_cluster" "shortly-aks" {
  name                = "shortly-aks"
  location            = azurerm_resource_group.shortly.location
  resource_group_name = azurerm_resource_group.shortly.name
  dns_prefix          = "shortlyaks"
  default_node_pool {
    name       = "default"
    vm_size    = var.node_pool_VM_size
    os_sku     = var.os_sku
    auto_scaling_enabled = true
    min_count             = 1
    max_count             = 2
    zones = [1, 2, 3]
  }
  kubernetes_version = var.kubernetes_version
  sku_tier = "Standard"
  oidc_issuer_enabled = true

  identity {
    type = "SystemAssigned"
  }

}

resource "azurerm_kubernetes_cluster_node_pool" "worker_node_pool" {
  name                  = "internal"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.shortly-aks.id
  vm_size    = var.node_pool_VM_size
  os_sku     = var.os_sku
  mode = "User"
  auto_scaling_enabled = true
  min_count             = 1
  max_count             = 6
  zones = [1, 2, 3]  

}

resource "azurerm_container_registry" "acr" {
  name                = "shortlyacr"
  resource_group_name = azurerm_resource_group.shortly.name
  location            = azurerm_resource_group.shortly.location
  sku                 = "Standard"
  admin_enabled       = false

}

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.shortly-aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
  depends_on = [azurerm_kubernetes_cluster.shortly-aks, azurerm_container_registry.acr]
}

