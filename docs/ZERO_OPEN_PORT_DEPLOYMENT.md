# Zero-Open-Port Security Architecture & Cloudflare Tunnel Deployment

## Why Zero-Open-Port Matters

Frameworks like OpenClaw suffered from **~30,000 misconfigured public instances** exposed directly to the public internet without pre-execution governance or firewall protection.

DeepClaw mandates a **Zero-Open-Port default posture**:
- No exposed public listening ports (`0.0.0.0:80` / `0.0.0.0:443`).
- Inbound webhooks from WhatsApp, Telegram, Slack, and Discord route via encrypted outbound tunnels (Cloudflare Tunnel or Tailscale Funnel).
- Every inbound request passes through `deepclaw/channels/channel_router.py` enforcing per-channel RBAC permission ceilings *before* touching agent logic.

---

## 🔒 1. Setting up Cloudflare Tunnel (Recommended)

### Step 1: Install Cloudflared
```bash
brew install cloudflared
# Or Linux: sudo apt-get install cloudflared
```

### Step 2: Authenticate & Create Tunnel
```bash
cloudflared tunnel login
cloudflared tunnel create deepclaw-agent-gateway
```

### Step 3: Configure `~/.cloudflared/config.yml`
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /root/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: agent-gateway.yourdomain.com
    service: http://127.0.0.1:8000
  - service: http_status:404
```

### Step 4: Run Tunnel
```bash
cloudflared tunnel run deepclaw-agent-gateway
```

Now, public webhooks point to `https://agent-gateway.yourdomain.com/webhook/whatsapp`, while your host server opens **zero inbound ports**.

---

## 🛡️ 2. Zero-Trust Permission Ceiling Mapping

| Channel Origin | Enforced Role | RBAC Ceiling | Action Policy |
|:---|:---|:---|:---|
| **Telegram / WhatsApp** | `external_channel` | Restricted (`read_public`, `send_reply`) | Irreversible actions block & trigger `HumanCheckpointNode` |
| **Slack / Teams** | `external_channel` | Workspace Scoped | Tool invocations require policy `PERMIT` decision |
| **Internal API** | `workflow_operator` | Operator Scoped | Full MCP & database query rights |
