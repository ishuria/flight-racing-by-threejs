package com.flightracing.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class UserMessage {

    public UserMessage () {

    }

    public UserMessage (String messageType) {
        this.messageType = messageType;
    }

    public static ObjectMapper messageMapper = new ObjectMapper();

    @JsonProperty("message_type")
    private String messageType;
    @JsonProperty("text")
    private String text;
    @JsonProperty("uuid")
    private String uuid;

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }


    public static UserMessage fromString(String data) throws Exception {
        UserMessage userMessage = messageMapper.readValue(data, UserMessage.class);
        return userMessage;
    }

    public static String toString(UserMessage userMessage) throws Exception {
        return messageMapper.writeValueAsString(userMessage);
    }
}
