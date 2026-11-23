-- Drop-in sender for any RemoteSpy / custom hook
-- Replace YOUR_PROJECT and YOUR_ANON_KEY

local HttpService = game:GetService("HttpService")

local SUPABASE_URL = "https://tbpxzmnukhoqthdozbwj.supabase.co"
local SUPABASE_ANON_KEY = "YOUR_ANON_KEY"

local function sendToReceiver(path, method, direction, args, caller)
    local payload = {
        remote_path = tostring(path),
        method = tostring(method or "FireServer"),
        direction = direction or "outgoing",
        args = args or {},
        caller = caller or "unknown",
        game_place_id = game.PlaceId
    }

    local url = SUPABASE_URL .. "/rest/v1/remote_events"
    local headers = {
        ["Content-Type"] = "application/json",
        ["apikey"] = SUPABASE_ANON_KEY,
        ["Authorization"] = "Bearer " .. SUPABASE_ANON_KEY,
        ["Prefer"] = "return=minimal"
    }

    local ok, err = pcall(function()
        HttpService:RequestAsync({
            Url = url,
            Method = "POST",
            Headers = headers,
            Body = HttpService:JSONEncode(payload)
        })
    end)

    if not ok then
        warn("[RemoteSpy Receiver] send failed:", err)
    end
end

-- Usage from your spy log function:
-- sendToReceiver(remote:GetFullName(), "FireServer", "outgoing", {arg1, arg2}, debug.traceback())

return sendToReceiver
