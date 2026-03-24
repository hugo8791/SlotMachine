using System.Text.Json;

namespace SlotMachine.Extensions;

public static class SessionExtensions
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static void SetJson<T>(this ISession session, string key, T value)
    {
        session.SetString(key, JsonSerializer.Serialize(value, SerializerOptions));
    }

    public static T? GetJson<T>(this ISession session, string key)
    {
        var json = session.GetString(key);
        return json is null ? default : JsonSerializer.Deserialize<T>(json, SerializerOptions);
    }
}
