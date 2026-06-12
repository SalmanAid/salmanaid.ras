import http from 'k6/http';
import { check, sleep } from 'k6';

const targetUsers = parseInt(__ENV.TARGET) || 20;
// Read the BASE_URL environment variable or default to localhost:3000
const baseUrl = __ENV.BASE_URL || 'http://host.docker.internal:3000';

export const options = {
    stages: [
        { duration: '10s', target: targetUsers },
        { duration: '30s', target: targetUsers },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    // Construct the endpoint dynamically
    const res = http.get(`${baseUrl}/api/health`);
    
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    
    sleep(1);
}

// ==========================
//      How To Run
// ==========================
// docker run --rm -i -e TARGET=150 -e BASE_URL=http://localhost:8080 --network host grafana/k6 run - < load-test.js
// 
