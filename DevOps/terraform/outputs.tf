output "resource_group_name" {
  value = azurerm_resource_group.shortly.name
}
output "kubernetes_cluster_name" {
  value = azurerm_kubernetes_cluster.shortly-aks.name
}

output "shortlyacr_url"{
  value = azurerm_container_registry.acr.login_server
}

output "kube_config" {
  value = azurerm_kubernetes_cluster.shortly-aks.kube_config_raw
  sensitive = true
}

output "aks_fqdn" {
  value = azurerm_kubernetes_cluster.shortly-aks.fqdn
}