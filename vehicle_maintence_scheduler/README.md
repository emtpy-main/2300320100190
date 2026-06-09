# Vehicle Maintenance Scheduler

## Start the Express server

1. Set your access token:

```bash
set ACCESS_TOKEN=your_token_here
```

2. Start the server from the repository root:

```bash
npm start
```

3. The server listens on `http://localhost:3000` by default.

## Test with Postman

- `GET http://localhost:3000/`
  - Returns a health-check JSON response.

- `POST http://localhost:3000/schedule`
  - Runs the scheduler.
  - Returns JSON with `TotalImpactScore`, `TotalHoursUsed`, and `SelectedTaskIDs`.

## Notes

- The server uses `ACCESS_TOKEN` from the environment.
- The scheduler calls the evaluation service endpoints internally.
- Logging is sent via the existing logger middleware.
