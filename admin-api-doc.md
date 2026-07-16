# Admin API Documentation

Base URL: `/v1`

All admin-protected endpoints (except login) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Authentication

### POST /v1/admin/login

Authenticate as an admin and receive a JWT token.

**Request Body**

| Field      | Type   | Required | Description         |
|------------|--------|----------|---------------------|
| `email`    | string | yes      | Admin email address |
| `password` | string | yes      | Admin password      |

**Success Response** `200 OK`

```json
{
  "token": "eyJhbGci..."
}
```

**Error Responses**

| Status | Description             |
|--------|-------------------------|
| 400    | Missing or invalid body |
| 401    | Invalid credentials     |

---

## Dashboard Statistics

### GET /v1/admin/stats

Returns overall platform statistics including aggregate rider metrics.

**Request** — no body, no query params.

**Success Response** `200 OK`

```json
{
  "total_users": 120,
  "total_riders": 45,
  "total_rides": 890,
  "total_charging_stations": 12,
  "pending_rides": 3,
  "accepted_rides": 2,
  "in_progress_rides": 5,
  "completed_rides": 800,
  "cancelled_rides": 80,
  "online_riders": 10,
  "overall_avg_rating": 4.32,
  "total_distance_km": 12450.75,
  "total_ride_time_seconds": 3240000
}
```

| Field                    | Type    | Description                                              |
|--------------------------|---------|----------------------------------------------------------|
| `total_users`            | integer | Total registered passenger accounts                      |
| `total_riders`           | integer | Total registered rider accounts                          |
| `total_rides`            | integer | Total rides ever created                                 |
| `total_charging_stations`| integer | Total charging stations                                  |
| `pending_rides`          | integer | Rides currently awaiting acceptance                      |
| `accepted_rides`         | integer | Rides accepted but not yet started                       |
| `in_progress_rides`      | integer | Rides currently in progress                              |
| `completed_rides`        | integer | Successfully completed rides                             |
| `cancelled_rides`        | integer | Cancelled rides                                          |
| `online_riders`          | integer | Riders active in the last 5 minutes                      |
| `overall_avg_rating`     | float   | Average rating across all riders                         |
| `total_distance_km`      | float   | Total distance (km) covered across all completed rides   |
| `total_ride_time_seconds`| integer | Total ride time (seconds) across all completed rides     |

---

## Ride Statistics

### GET /v1/admin/stats/rides

Returns daily ride statistics within a date range.

**Query Parameters**

| Parameter    | Type   | Required | Default        | Description              |
|--------------|--------|----------|----------------|--------------------------|
| `start_date` | string | no       | 30 days ago    | Start date `YYYY-MM-DD`  |
| `end_date`   | string | no       | today          | End date `YYYY-MM-DD`    |

**Success Response** `200 OK`

```json
{
  "start_date": "2026-02-15",
  "end_date": "2026-03-17",
  "stats": [
    {
      "date": "2026-03-17",
      "total_rides": 25,
      "completed_rides": 20,
      "cancelled_rides": 3,
      "total_revenue": 450000.00
    }
  ]
}
```

| Field             | Type    | Description                        |
|-------------------|---------|------------------------------------|
| `date`            | string  | Date in `YYYY-MM-DD` format        |
| `total_rides`     | integer | All rides created on that date     |
| `completed_rides` | integer | Completed rides on that date       |
| `cancelled_rides` | integer | Cancelled rides on that date       |
| `total_revenue`   | float   | Revenue from completed rides       |

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| 400    | Invalid date format             |
| 500    | Internal server error           |

---

### GET /v1/admin/rides/:ride_id/stats

Returns detailed statistics for a single ride.

**Path Parameters**

| Parameter  | Type   | Description     |
|------------|--------|-----------------|
| `ride_id`  | UUID   | The ride's UUID |

**Success Response** `200 OK`

```json
{
  "ride_id": "uuid",
  "passenger_id": "uuid",
  "rider_id": "uuid",
  "origin_name": "Kampala Road",
  "destination_name": "Entebbe",
  "distance_km": "15.30",
  "duration_seconds": 2700,
  "status": "completed",
  "price": "25000.00",
  "created_at": "2026-03-17T10:00:00Z",
  "updated_at": "2026-03-17T10:45:00Z",
  "passenger_name": "Jane Doe",
  "passenger_phone": "+256700000001",
  "rider_name": "John Rider",
  "rider_phone": "+256700000002",
  "rating": 5,
  "rating_comment": "Excellent ride!"
}
```

| Field              | Type    | Description                                                    |
|--------------------|---------|----------------------------------------------------------------|
| `ride_id`          | UUID    | The ride identifier                                            |
| `passenger_id`     | UUID    | Passenger user ID                                              |
| `rider_id`         | UUID    | Rider ID (null if ride was never accepted)                     |
| `origin_name`      | string  | Human-readable pickup location                                 |
| `destination_name` | string  | Human-readable drop-off location                               |
| `distance_km`      | decimal | Distance in kilometres                                         |
| `duration_seconds` | integer | Estimated ride duration in seconds (based on ETA at booking)   |
| `status`           | string  | One of: `pending`, `accepted`, `in_progress`, `completed`, `cancelled` |
| `price`            | decimal | Fare charged                                                   |
| `passenger_name`   | string  | Passenger's full name                                          |
| `passenger_phone`  | string  | Passenger's phone number                                       |
| `rider_name`       | string  | Rider's full name (omitted if no rider assigned)               |
| `rider_phone`      | string  | Rider's phone number (omitted if no rider assigned)            |
| `rating`           | integer | Rating given for the ride 1–5 (omitted if not rated)           |
| `rating_comment`   | string  | Optional review comment (omitted if not rated)                 |

**Error Responses**

| Status | Description          |
|--------|----------------------|
| 400    | Invalid ride_id      |
| 404    | Ride not found       |

---

## Rider Management

### GET /v1/admin/riders

Returns a paginated list of all riders with their profile details.

**Query Parameters**

| Parameter | Type    | Required | Default | Description          |
|-----------|---------|----------|---------|----------------------|
| `limit`   | integer | no       | 50      | Number of results    |
| `offset`  | integer | no       | 0       | Pagination offset    |

**Success Response** `200 OK`

```json
{
  "count": 2,
  "limit": 50,
  "offset": 0,
  "riders": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "John Rider",
      "phone": "+256700000001",
      "email": "john@example.com",
      "firebase_uid": "abc123",
      "vehicle_plate": "UAA 123A",
      "vehicle_type": "motorcycle",
      "status": "available",
      "avg_rating": 4.5,
      "total_ratings": 30,
      "photo_url": "https://...",
      "license_photo_url": "https://...",
      "nin_photo_url": "https://...",
      "current_location": "POINT(32.5825 0.3476)",
      "last_seen": "2026-03-17 10:30:00",
      "created_at": "2026-01-01 08:00:00",
      "updated_at": "2026-03-17 10:30:00"
    }
  ]
}
```

---

### POST /v1/admin/riders

Manually create a new rider (creates a user account if the phone number is not already registered).

**Request Body**

| Field          | Type   | Required | Description                          |
|----------------|--------|----------|--------------------------------------|
| `full_name`    | string | yes      | Rider's full name                    |
| `phone_number` | string | yes      | Rider's phone number (unique)        |
| `email`        | string | no       | Rider's email address                |
| `license_plate`| string | yes      | Vehicle licence plate number         |
| `vehicle_type` | string | no       | e.g. `motorcycle`, `bicycle`         |
| `username`     | string | no       | Display name override (defaults to `full_name`) |

**Success Response** `201 Created`

```json
{
  "message": "rider created successfully",
  "rider": {
    "id": "uuid",
    "user_id": "uuid",
    "vehicle_plate": "UAA 123A",
    "vehicle_type": "motorcycle",
    "status": "available",
    "created_at": "2026-03-17T10:00:00Z"
  },
  "user": {
    "id": "uuid",
    "phone": "+256700000001",
    "name": "John Rider",
    "email": "john@example.com",
    "created_at": "2026-03-17T10:00:00Z"
  }
}
```

**Error Responses**

| Status | Description                               |
|--------|-------------------------------------------|
| 400    | Missing required fields                   |
| 409    | A rider already exists for this phone number |
| 500    | Internal server error                     |

---

### DELETE /v1/admin/riders/:rider_id

Delete a rider by ID.

**Path Parameters**

| Parameter   | Type | Description      |
|-------------|------|------------------|
| `rider_id`  | UUID | The rider's UUID |

**Success Response** `204 No Content`

**Error Responses**

| Status | Description       |
|--------|-------------------|
| 400    | Invalid rider_id  |
| 404    | Rider not found   |

---

### GET /v1/admin/riders/:rider_id/stats

Returns statistics for a single rider.

**Path Parameters**

| Parameter   | Type | Description      |
|-------------|------|------------------|
| `rider_id`  | UUID | The rider's UUID |

**Success Response** `200 OK`

```json
{
  "rider_id": "uuid",
  "rider_name": "John Rider",
  "rider_phone": "+256700000001",
  "total_rides": 120,
  "completed_rides": 110,
  "cancelled_rides": 5,
  "total_distance_km": 1450.75,
  "total_ride_time_seconds": 432000,
  "avg_rating": 4.6,
  "total_ratings": 95
}
```

| Field                     | Type    | Description                                                       |
|---------------------------|---------|-------------------------------------------------------------------|
| `rider_id`                | UUID    | Rider identifier                                                  |
| `rider_name`              | string  | Rider's full name                                                 |
| `rider_phone`             | string  | Rider's phone number                                              |
| `total_rides`             | integer | Total rides assigned to this rider (all statuses)                 |
| `completed_rides`         | integer | Rides the rider completed                                         |
| `cancelled_rides`         | integer | Rides that were cancelled                                         |
| `total_distance_km`       | float   | Total distance (km) covered across completed rides                |
| `total_ride_time_seconds` | integer | Total ride time (seconds) across completed rides (based on ETA)   |
| `avg_rating`              | float   | Rider's average rating (0 if no ratings yet)                      |
| `total_ratings`           | integer | Number of ratings received                                        |

**Error Responses**

| Status | Description       |
|--------|-------------------|
| 400    | Invalid rider_id  |
| 404    | Rider not found   |

---

## User Management

### GET /v1/admin/users

Returns a paginated list of all passenger users.

**Query Parameters**

| Parameter | Type    | Required | Default | Description       |
|-----------|---------|----------|---------|-------------------|
| `limit`   | integer | no       | 50      | Number of results |
| `offset`  | integer | no       | 0       | Pagination offset |

**Success Response** `200 OK`

```json
{
  "users": [
    {
      "id": "uuid",
      "firebase_uid": "abc123",
      "phone": "+256700000001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "created_at": "2026-01-01T08:00:00Z",
      "updated_at": "2026-03-17T10:00:00Z"
    }
  ]
}
```

---

### DELETE /v1/admin/users/:user_id

Delete a user account by ID.

**Path Parameters**

| Parameter  | Type | Description     |
|------------|------|-----------------|
| `user_id`  | UUID | The user's UUID |

**Success Response** `204 No Content`

**Error Responses**

| Status | Description      |
|--------|------------------|
| 400    | Invalid user_id  |
| 404    | User not found   |

---

## Rides

### GET /v1/admin/rides

Returns a paginated list of all rides.

**Query Parameters**

| Parameter | Type    | Required | Default | Description       |
|-----------|---------|----------|---------|-------------------|
| `limit`   | integer | no       | 50      | Number of results |
| `offset`  | integer | no       | 0       | Pagination offset |

**Success Response** `200 OK`

```json
{
  "count": 2,
  "rides": [
    {
      "id": "uuid",
      "passenger_id": "uuid",
      "rider_id": "uuid",
      "origin": "POINT(32.58 0.34)",
      "destination": "POINT(32.60 0.35)",
      "origin_name": "Kampala Road",
      "destination_name": "Entebbe",
      "distance_km": "15.30",
      "status": "completed",
      "price": "25000.00",
      "eta_seconds": 2700,
      "created_at": "2026-03-17T10:00:00Z",
      "updated_at": "2026-03-17T10:45:00Z"
    }
  ]
}
```

---

## Charging Stations

### POST /v1/admin/charging_stations

Create a new charging station.

**Request Body**

| Field             | Type   | Required | Description                                   |
|-------------------|--------|----------|-----------------------------------------------|
| `name`            | string | yes      | Station name                                  |
| `description`     | string | no       | Description of the station                    |
| `lat`             | float  | yes      | Latitude of the station                       |
| `lon`             | float  | yes      | Longitude of the station                      |
| `location_string` | string | no       | Human-readable address or area name           |
| `capacity`        | integer| no       | Number of charging bays (defaults to 1)       |
| `meta`            | object | no       | Any additional metadata as a JSON object      |

**Success Response** `201 Created`

```json
{
  "id": "uuid",
  "name": "Kampala Central Station",
  "description": "Main charging hub in the CBD",
  "location": "POINT(32.5825 0.3476)",
  "location_string": "Plot 12, Kampala Road, Kampala",
  "capacity": 5,
  "meta": { "operator": "EV Uganda" },
  "created_at": "2026-03-17T10:00:00Z",
  "updated_at": "2026-03-17T10:00:]00Z"
}
```

**Error Responses**

| Status | Description             |
|--------|-------------------------|
| 400    | Missing required fields |
| 500    | Internal server error   |

---

### GET /v1/admin/charging_stations

Returns a paginated list of all charging stations.

**Query Parameters**

| Parameter | Type    | Required | Default | Description       |
|-----------|---------|----------|---------|-------------------|
| `limit`   | integer | no       | 50      | Number of results |
| `offset`  | integer | no       | 0       | Pagination offset |

**Success Response** `200 OK`

```json
{
  "charging_stations": [
    {
      "id": "uuid",
      "name": "Kampala Central Station",
      "description": "Main charging hub in the CBD",
      "location": "POINT(32.5825 0.3476)",
      "location_string": "Plot 12, Kampala Road, Kampala",
      "capacity": 5,
      "meta": {},
      "created_at": "2026-03-17T10:00:00Z",
      "updated_at": "2026-03-17T10:00:00Z"
    }
  ]
}
```

---

### GET /v1/admin/charging_stations/:id

Get a single charging station by ID.

**Path Parameters**

| Parameter | Type | Description           |
|-----------|------|-----------------------|
| `id`      | UUID | The station's UUID    |

**Success Response** `200 OK` — same shape as a single item from the list above.

**Error Responses**

| Status | Description              |
|--------|--------------------------|
| 400    | Invalid id               |
| 404    | Charging station not found |

---

### PUT /v1/admin/charging_stations/:id

Update an existing charging station.

**Path Parameters**

| Parameter | Type | Description        |
|-----------|------|--------------------|
| `id`      | UUID | The station's UUID |

**Request Body** — same fields as `POST /v1/admin/charging_stations`. `name`, `lat`, and `lon` are required.

**Success Response** `200 OK` — same shape as the create response.

**Error Responses**

| Status | Description             |
|--------|-------------------------|
| 400    | Invalid id or body      |
| 500    | Internal server error   |

---

### DELETE /v1/admin/charging_stations/:id

Delete a charging station by ID.

**Path Parameters**

| Parameter | Type | Description        |
|-----------|------|--------------------|
| `id`      | UUID | The station's UUID |

**Success Response** `204 No Content`

**Error Responses**

| Status | Description       |
|--------|-------------------|
| 400    | Invalid id        |
| 500    | Internal server error |

---

## General Notes

- All timestamps are returned in ISO 8601 UTC format: `2026-03-17T10:00:00Z`
- All IDs are UUIDs in string format: `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`
- Numeric values (price, distance) are returned as decimal strings to avoid floating-point precision issues
- Pagination is cursor-less (limit/offset based); use `limit` and `offset` to navigate pages
- `204 No Content` responses have no body
- All error responses follow this shape:
  ```json
  { "error": "description of the problem" }
  ```
- CORS is enabled for `http://localhost:5173` and `http://localhost:5174`
