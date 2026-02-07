variable "kubernetes_version"{
    type = string
    default = "1.34.2"
}
variable "node_pool_VM_size" {
    type = string
    default = "Standard_D2ads_v7"
}
variable "os_sku" {
    type = string
    default = "Ubuntu"
}