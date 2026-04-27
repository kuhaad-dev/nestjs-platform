# Enable the Kubernetes Engine API programmatically
# Even though you enabled it manually, Terraform manages this
# so it can be reproduced from scratch on any project
resource "google_project_service" "container" {
  service            = "container.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "compute" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

# VPC Network — your private network on GCP
# Nothing runs directly in the default VPC — always create your own
# This gives you control over IP ranges and firewall rules
resource "google_compute_network" "vpc" {
  name                    = "${var.cluster_name}-vpc"
  auto_create_subnetworks = false   # we create subnet manually below

  depends_on = [google_project_service.compute]
}

# Subnet — a range of IPs within your VPC
# Your nodes will get IPs from this range
resource "google_compute_subnetwork" "subnet" {
  name          = "${var.cluster_name}-subnet"
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.0.0/24"   # 254 usable IPs — plenty for learning
}

# GKE Cluster — the control plane
# This is the brain of your Kubernetes cluster
# GKE manages the control plane for you — you only manage worker nodes
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.zone

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false

  depends_on = [google_project_service.container]

  timeouts {
    create = "60m"
    update = "60m"
    delete = "60m"
  }
}

# Node Pool — the actual VMs that run your pods
# Separated from cluster definition so we can modify nodes
# without recreating the entire cluster
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  # Auto-repair: if a node goes unhealthy, GKE replaces it
  # Auto-upgrade: GKE keeps node K8s version up to date
  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = var.machine_type

    # OAuth scopes — what GCP APIs these nodes can access
    # cloud-platform gives full access — fine for learning
    # In production you'd scope this down precisely
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env     = "learning"
      project = "nestjs-platform"
    }
  }
}


resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = "nestjs-app"
  format        = "DOCKER"

  depends_on = [google_project_service.artifactregistry] 
}

resource "google_project_service" "artifactregistry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}