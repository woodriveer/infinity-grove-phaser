//  Points the Traefik proxy at one slot: the dynamic conf names only that slot, and Traefik hot-reloads it when the file changes,
//  so requests in flight finish and no client connection is closed
const PROXY = 'infinity-grove-proxy';
const FILE = '/etc/traefik/dynamic/backend.yml';
const API = 'http://127.0.0.1:8080/api/http/services/backend@file';

export const renderConf = (slot) => `http:
  routers:
    backend:
      entryPoints: [ web ]
      rule: PathPrefix(\`/\`)
      service: backend
  services:
    backend:
      loadBalancer:
        servers:
          - url: http://backend-${slot}:8080
`;

//  Written from inside the container: a bind mount of a Windows folder never wakes Traefik's file watcher (tested, Docker Desktop).
//  The new conf counts only once the Traefik API serves it; otherwise the previous conf is put back, so the active slot stays
export const switchScript = (slot) => [
    `[ -f ${FILE} ] && cp ${FILE} ${FILE}.bak || rm -f ${FILE}.bak`,
    `cat > ${FILE}.tmp && mv ${FILE}.tmp ${FILE}`,
    `for i in $(seq 1 20); do wget -qO- ${API} 2>/dev/null | grep -q 'backend-${slot}:8080' && exit 0; sleep 0.5; done`,
    `if [ -f ${FILE}.bak ]; then mv ${FILE}.bak ${FILE}; else rm -f ${FILE}; fi`,
    'exit 1'
].join('\n');

export const switchTo = (exec, slot) =>
    exec('docker', ['exec', '-i', PROXY, 'sh', '-c', switchScript(slot)], { input: renderConf(slot) }).status === 0;
