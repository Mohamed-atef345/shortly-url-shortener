# Shortly — URL Shortener

A production-grade URL shortener deployed on **Azure Kubernetes Service** with a full DevOps pipeline using GitOps.

> **Domain**: [myshortly.tech](https://myshortly.tech) | **ArgoCD**: [argocd.myshortly.tech](https://argocd.myshortly.tech) | **Grafana**: [grafana.myshortly.tech](https://grafana.myshortly.tech)

---

## Architecture

```
Developer → GitLab CI (Test, Build, Scan, Update values.yaml) → Git (main)
                                                                       │
                                                                ArgoCD (GitOps)
                                                                       │
                                                                       ▼
                                                         Azure Kubernetes Service
                                                      ┌─────────────────────────────┐
                                                      │   NGINX Ingress (TLS)       │
                                                      │  ┌───────┐ ┌─────────┐      │
                                                      │  │  /api │ │    /    │      │
                                                      │  └───┬───┘ └────┬────┘      │
                                                      │      ▼          ▼           │
                                                      │  Backend    Frontend        │
                                                      │  (Elysia)   (Next.js)       │
                                                      │      │                      │
                                                      │      ▼                      │
                                                      │    Redis                    │
                                                      └──────┼──────────────────────┘
                                                             │
                                                             ▼
                                                      MongoDB Atlas (External)
```

---

## Tech Stack

### Application

| Component    | Technology                           |
| ------------ | ------------------------------------ |
| **Backend**  | Bun + Elysia (TypeScript)            |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 |
| **Database** | MongoDB Atlas                        |
| **Cache**    | Redis (in-cluster)                   |
| **Auth**     | JWT + bcrypt, RBAC                   |

### DevOps

| Category               | Tool                           | Status         |
| ---------------------- | ------------------------------ | -------------- |
| **Cloud Provider**     | Azure                          | ✅ Implemented |
| **Container Registry** | Azure Container Registry (ACR) | ✅ Implemented |
| **Kubernetes**         | Azure Kubernetes Service (AKS) | ✅ Implemented |
| **IaC**                | Terraform                      | ✅ Implemented |
| **CI/CD (Build)**      | GitLab CI                      | ✅ Implemented |
| **GitOps (CD)**        | ArgoCD                         | ✅ Implemented |
| **Package Manager**    | Helm                           | ✅ Implemented |
| **Secrets**            | Bitnami Sealed Secrets         | ✅ Implemented |
| **Ingress**            | NGINX Ingress Controller       | ✅ Implemented |
| **HPA**                | Horizontal Pod Autoscaler      | ✅ Implemented |
| **Security Scanning**  | Trivy                          | ✅ Implemented |
| **TLS**                | cert-manager + Let's Encrypt   | ✅ Implemented |
| **Static IP**          | Terraform-managed Public IP    | ✅ Implemented |
| **Monitoring**         | Prometheus + Grafana           | ✅ Implemented |

---

## Project Structure

```
shortly_url_shortener/
├── backend/                    # Bun + Elysia REST API
│   ├── Dockerfile
│   └── src/
│       ├── index.ts
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── tests/
│
├── frontend/                   # Next.js 16 app
│   ├── Dockerfile
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── providers/
│
├── DevOps/
│   ├── terraform/
│   │   ├── provider.tf         # AzureRM provider + remote backend
│   │   ├── main.tf             # AKS, ACR, node pools, role assignments, static IP
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── k8s/
│       ├── nginx-ingress-values.yaml
│       ├── prometheus-stack-values.yaml
│       ├── argocd/
│       │   └── aplication.yaml            # ArgoCD Application manifest
│       └── shorly/                        # Application Helm chart
│           ├── Chart.yaml
│           ├── values.yaml
│           └── templates/
│               ├── backend_deployment.yaml
│               ├── frontend_deployment.yaml
│               ├── redis.yaml
│               ├── service.yaml
│               ├── ingress.yaml           # App ingress (myshortly.tech)
│               ├── argocd-ingress.yaml    # ArgoCD ingress (argocd.myshortly.tech)
│               ├── clusterIssuer.yaml
│               ├── HPA.yaml
│               └── sealed-secret.yaml
│
├── Output/                     # Screenshots & demo videos
└── .gitlab-ci.yml
```

---

## Backend API

| Endpoint                         | Method | Auth   | Description              |
| -------------------------------- | ------ | ------ | ------------------------ |
| `/health`                        | GET    | —      | Health check (+ Redis)   |
| `/swagger`                       | GET    | —      | Swagger UI               |
| `/api/auth/register`             | POST   | —      | Register user            |
| `/api/auth/login`                | POST   | —      | Login (returns JWT)      |
| `/api/auth/me`                   | GET    | Bearer | Current user profile     |
| `/api/auth/delete-account`       | DELETE | Bearer | Delete account           |
| `/api/urls`                      | POST   | Bearer | Create short URL         |
| `/api/urls`                      | GET    | Bearer | List user's URLs         |
| `/api/urls/:shortCode/analytics` | GET    | Bearer | URL click analytics      |
| `/api/urls/:shortCode`           | DELETE | Bearer | Delete URL               |
| `/:shortCode`                    | GET    | —      | Redirect to original URL |

---

## Infrastructure

### Terraform Resources

| Resource                | Config                                                       |
| ----------------------- | ------------------------------------------------------------ |
| **Resource Group**      | `shortly-prod`, West Europe                                  |
| **AKS Cluster**         | Standard tier, OIDC enabled, system-assigned identity        |
| **Default Node Pool**   | Autoscale 1–2 nodes, 3 AZs                                   |
| **Worker Node Pool**    | Autoscale 1–6 nodes, 3 AZs, User mode                        |
| **ACR**                 | Standard SKU, `AcrPull` role assigned to AKS kubelet         |
| **Static Public IP**    | Standard SKU, assigned to NGINX Ingress Controller           |
| **Network Contributor** | AKS identity granted `Network Contributor` on resource group |
| **TF State Backend**    | Azure Storage Account (`shortlytfstate/tfstate`)             |

> **Note**: The `Network Contributor` role is required for AKS to bind the static IP to the LoadBalancer and to ensure clean `terraform destroy` without IP conflict errors.

### Manual Step (First Deploy Only)

If the AKS cluster already exists without the role, run once:

```bash
AKS_IDENTITY=$(az aks show --resource-group shortly-prod --name shortly-aks --query "identity.principalId" -o tsv)

az role assignment create \
  --assignee $AKS_IDENTITY \
  --role "Network Contributor" \
  --scope /subscriptions/4dd86afc-5a1c-41bd-8c1b-ef92bf7c672b/resourceGroups/shortly-prod
```

### Kubernetes Resources

- **Deployments**: Backend (2 replicas), Frontend (2 replicas), Redis (1 replica)
- **Services**: ClusterIP for all three
- **Ingress**: NGINX — routes `/api` to backend, `/` to frontend on `myshortly.tech`
- **ArgoCD Ingress**: NGINX — routes `argocd.myshortly.tech` to `argocd-server:80` (HTTP backend protocol)
- **TLS**: cert-manager + Let's Encrypt (auto-provisioned & auto-renewed)
- **ClusterIssuer**: Let's Encrypt production with HTTP-01 solver
- **Monitoring**: Prometheus + Grafana at [grafana.myshortly.tech](https://grafana.myshortly.tech) with TLS
- **HPA**: Frontend & backend scale 2→5 pods on CPU (60%) or memory (70%)
- **Sealed Secrets**: All env vars encrypted with Bitnami Sealed Secrets
- **Probes**: Liveness & readiness on all deployments

---

## CI/CD Pipeline

### Stages

```
test  →  infra  →  build  →  scan  →  edit_manifests  →  deploy
```

### GitOps Flow

```
GitLab CI builds image → updates values.yaml with new SHA → commits [skip ci]
                                                                   │
                                                            ArgoCD detects change
                                                                   │
                                                            Syncs Helm chart to AKS
```

### Jobs

| Job                       | Stage          | Description                                                                         |
| ------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `test_frontend`           | test           | `bun install` → lint → typecheck                                                    |
| `test_backend`            | test           | `bun install` → test → lint → typecheck                                             |
| `infra_plan`              | infra          | `terraform plan`                                                                    |
| `infra_apply`             | infra          | `terraform apply` → exports outputs to `dotenv`                                     |
| `build_and_push_backend`  | build          | Docker build → push to ACR (`:$SHA` + `:latest`)                                    |
| `build_and_push_frontend` | build          | Docker build with `NEXT_PUBLIC_*` args → push to ACR                                |
| `push_redis_to_acr`       | build          | Mirror hardened Redis from `dhi.io` to ACR                                          |
| `scan_backend`            | scan           | Trivy CRITICAL scan → JSON report artifact                                          |
| `scan_frontend`           | scan           | Trivy CRITICAL scan → JSON report artifact                                          |
| `push_to_repo`            | edit_manifests | `yq` update `values.yaml` with new image tags + ACME email → `git commit [skip ci]` |
| `deploy_to_aks`           | deploy         | Install NGINX / cert-manager / Sealed Secrets / Prometheus / ArgoCD (idempotent)    |

### ArgoCD Application

Configured in `DevOps/k8s/argocd/aplication.yaml`:

- **Source**: `DevOps/k8s/shorly` (Helm chart in this repo)
- **Auto-sync**: enabled with `prune`, `selfHeal`, `retry` (5 attempts)
- **Sync options**: `CreateNamespace`, `PruneLast`, `ApplyOutOfSyncOnly`
- **Revision history**: 10 rollbacks kept

---

## Local Development

```bash
# Backend
cd backend && bun install && bun run dev     # http://localhost:3002

# Frontend
cd frontend && bun install && bun run dev    # http://localhost:3000
```

---

## Environment Variables

Managed via **Sealed Secrets** in the cluster.

| Variable               | Description                     |
| ---------------------- | ------------------------------- |
| `MONGODB_URI`          | MongoDB Atlas connection string |
| `JWT_SECRET`           | JWT signing secret              |
| `JWT_EXPIRES_IN`       | Token expiry                    |
| `REDIS_URL`            | Redis connection URL            |
| `REDIS_PASSWORD`       | Redis auth password             |
| `REDIS_ENABLED`        | Enable/disable Redis cache      |
| `FRONTEND_URL`         | CORS origin                     |
| `NEXT_PUBLIC_API_URL`  | Backend URL for frontend        |
| `NEXT_PUBLIC_BASE_URL` | Base URL for short links        |
| `PORT`                 | Backend port (3002)             |
| `NODE_ENV`             | Environment (production)        |

---

## Screenshots

### Application

![Homepage](Output/homepage.png)

### ArgoCD — GitOps Dashboard

![ArgoCD Application Tree](Output/argocd1.png)
![ArgoCD Sync Status](Output/argocd2.png)
![ArgoCD Resource Health](Output/argocd3.png)

### Grafana Monitoring

![Grafana Dashboard - Cluster Overview](Output/grafana1.png)
![Grafana Dashboard - Pod Metrics](Output/grafana2.png)

---

## Demo

### [🎬 Watch App Demo](Output/Demo.mp4)

### [🎬 Watch ArgoCD Demo](Output/argocd%20demo.mp4)
