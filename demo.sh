#!/usr/bin/env bash
set -e

# Demo script for GreenSentinel application
# Usage: ./demo.sh [dev|prod] [--reset]

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

MODE=${1:-dev}      # default dev
RESET=$2            # optional --reset

echo -e "${BLUE}🚀 GreenSentinel Demo Launcher${NC}"
echo -e "${BLUE}══════════════════════════════${NC}"
echo -e "Mode: ${YELLOW}$MODE${NC}"

if [[ "$RESET" == "--reset" ]]; then
  echo -e "${RED}🧹 Purging all Docker volumes...${NC}"
  docker compose down -v --remove-orphans
  docker volume prune -f
  echo -e "${GREEN}✓ Volumes purged${NC}"
else
  echo -e "${YELLOW}🔄 Stopping previous containers...${NC}"
  docker compose down --remove-orphans
  echo -e "${GREEN}✓ Previous containers stopped${NC}"
fi

echo -e "${YELLOW}🔍 Checking environment files...${NC}"
if [ ! -f .env.dev ]; then
  echo -e "${BLUE}ℹ️ Creating .env.dev from example...${NC}"
  cp .env.dev.example .env.dev
fi

if [ ! -f .env.prod ]; then
  echo -e "${BLUE}ℹ️ Creating .env.prod from example...${NC}"
  cp .env.prod.example .env.prod
fi

echo -e "${YELLOW}🔧 Starting GreenSentinel in ${MODE} mode...${NC}"
if [[ "$MODE" == "prod" ]]; then
  make prod
else
  # Run in background to continue with seeding
  make dev &
fi

echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
until curl -s http://localhost:8000/health >/dev/null; do 
  echo -n "."
  sleep 2
done
echo -e "\n${GREEN}✓ Backend is up!${NC}"

echo -e "${YELLOW}🌱 Seeding demo data...${NC}"
docker compose exec backend python scripts/seed_demo.py
echo -e "${GREEN}✓ Demo data seeded${NC}"

# Get the host IP or hostname
HOST_IP=$(hostname -I | awk '{print $1}')
if [[ -z "$HOST_IP" ]]; then
  HOST_IP="localhost"
fi

echo -e "\n${GREEN}🎉 GreenSentinel is ready!${NC}"
echo -e "${BLUE}══════════════════════════════${NC}"

# Print URLs depending on mode
if [[ "$MODE" == "prod" ]]; then
  echo -e "Backend API:   ${YELLOW}https://api.greensentinel.local/docs${NC}"
  echo -e "Admin Panel:   ${YELLOW}https://dashboard.greensentinel.local${NC}"
  echo -e "Pro App:       ${YELLOW}https://pro.greensentinel.local${NC}"
  echo -e "Grafana:       ${YELLOW}https://grafana.greensentinel.local${NC} (admin / check .env.prod)"
  echo -e "\n${BLUE}ℹ️ Note:${NC} Add these domains to your hosts file or configure DNS to point to your server IP"
else
  echo -e "Backend API:   ${YELLOW}http://${HOST_IP}:8000/docs${NC}"
  echo -e "Admin Panel:   ${YELLOW}http://${HOST_IP}:3000${NC}"
  echo -e "Pro App:       ${YELLOW}http://${HOST_IP}:5173${NC}"
  echo -e "Grafana:       ${YELLOW}http://${HOST_IP}:3001${NC} (admin / admin)"
fi

echo -e "\n${BLUE}ℹ️ To stop the stack:${NC} make down"
echo -e "${BLUE}══════════════════════════════${NC}"

# If in dev mode, we started the process in the background
# Attach to logs to keep the script running
if [[ "$MODE" == "dev" ]]; then
  echo -e "${YELLOW}📊 Showing container logs (Ctrl+C to exit)...${NC}"
  docker compose logs -f
fi
