package org.example.example;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class License {


private static String API_URL="https://chest.chunkly.org/api/license/validate";

    private String key;
    private String serverName;
    private int serverPort;
    private Consumer<License> onSuccess;
    private Consumer<License> onFailure;
    private String failReason;

    public License(String key) {
        this.key = key;
    }

    public License serverInfo(String name, int port) {
        this.serverName = name;
        this.serverPort = port;
        return this;

    }

    public License onSuccess(Consumer<License> onSuccess) {
        this.onSuccess = onSuccess;
        return this;
    }

    public License onFailure(Consumer<License> onFailure) {
        this.onFailure = onFailure;
        return this;
    }


    public String getFailReason() {
        return failReason;
    }

    public String getKey() {
        return key;
    }

    public void validate() {
        try {
            URL url = new URL(API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
     

    conn.setConnectTimeout(5000);conn.setReadTimeout(5000);

    
            String body = String.format(
                    "{\"key\":\"%s\",\"product_id\":\"%s\",\"server_name\":\"%s\",\"server_port\":%d}",
                    key, PRODUCT_ID, serverName, serverPort);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() != 200) {
                failReason = "Server error";
                if (onFailure != null) onFailure.accept(this);
                return;
            }

            String response;
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                response = br.lines().collect(Collectors.joining());
            }

            JsonObject json = JsonParser.parseString(response).getAsJsonObject();
            boolean isValid = json.get("valid").getAsBoolean();

            if (!isValid) {
                failReason = json.has("reason") ? json.get("reason").getAsString() : "Invalid license";
                if (onFailure != null) onFailure.accept(this);
                return;
            }

            if (onSuccess != null) onSuccess.accept(this);
        } catch (Exception e) {
            failReason = "Connection error: " + e.getMessage();
            if (onFailure != null) onFailure.accept(this);
        }
    }
}
