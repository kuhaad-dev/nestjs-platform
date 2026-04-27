output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_region" {
  description = "GKE cluster region"
  value       = var.region
}

output "kubectl_config_command" {
  description = "Run this command to configure kubectl to talk to your GKE cluster"
  value       = "gcloud container clusters get-credentials ${var.cluster_name} --zone ${var.zone} --project ${var.project_id}"
}