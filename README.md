# RemoteSpy Receiver

Simple HTML/CSS/JS + Supabase live feed for Roblox RemoteSpy events.

## Setup

1. Create a Supabase project.
2. Run `schema.sql` in the SQL editor.
3. Enable Realtime for the `remote_events` table (Database → Replication).
4. Copy Project URL + anon key into `app.js` and `send_example.lua`.
5. Open `index.html` (or host the folder anywhere).

## Lua side

Call `sendToReceiver(path, method, direction, args, caller)` from your RemoteSpy log hook.
See `send_example.lua`.

## Payload

```json
{
  "remote_path": "ReplicatedStorage.Remotes.SomeEvent",
  "method": "FireServer",
  "direction": "outgoing",
  "args": ["any", 123],
  "caller": "script or packet",
  "game_place_id": 123456789
}
```
