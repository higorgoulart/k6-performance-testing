import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getPopulationDuration = new Trend('get_population_duration', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    get_population_duration: ['p(95)<5700'],
    http_req_failed: ['rate<0.12'],
    content_OK: ['rate>0.95']
  },
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '15s', target: 0 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://datausa.io/api/data?drilldowns=Nation&measures=Population';
  const params = { headers: { 'Content-Type': 'application/json' } };
  const OK = 200;

  const res = http.get(baseUrl, params);

  getPopulationDuration.add(res.timings.duration);
  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Population - Status 200': () => res.status === OK
  });
}
