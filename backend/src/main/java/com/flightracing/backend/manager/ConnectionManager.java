package com.flightracing.backend.manager;

import com.flightracing.backend.consts.MessageType;
import com.flightracing.backend.model.UserConnection;
import com.flightracing.backend.model.UserMessage;
import com.flightracing.backend.task.HeartbeatTask;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoField;
import java.time.temporal.TemporalField;
import java.time.temporal.TemporalUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * websocket链接管理器
 * 用于管理每一个对服务器的链接
 * 静态，全局唯一
 */
@Component
public class ConnectionManager {

    // 链接管理容器的初始化大小
    // 一般而言，一个服务处理1000个链接已经快要到瓶颈了
    private static final int DEFAULT_STARTUP_CAPACITY = 1000;

    public static ConcurrentHashMap<String, UserConnection> connectionStorage;

    private static ScheduledExecutorService heartbeatExecutorService;

    static {
        connectionStorage = new ConcurrentHashMap<>(DEFAULT_STARTUP_CAPACITY);
        heartbeatExecutorService = Executors.newSingleThreadScheduledExecutor(new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "Thread-Heartbeat");
            }
        });
        heartbeatExecutorService.scheduleWithFixedDelay(new HeartbeatTask(), 60, 120, TimeUnit.SECONDS);
    }

    public static void onConnected(UserConnection newConnection) {
        if (newConnection == null) {
            return;
        }
        if (newConnection.getUuid().length() == 0) {
            return;
        }
        connectionStorage.put(newConnection.getUuid(), newConnection);
        UserMessage uuidMessage = new UserMessage();
        uuidMessage.setMessageType(MessageType.UUID);
        uuidMessage.setUuid(newConnection.getUuid());

        sendMessage(newConnection.getUuid(), uuidMessage);
    }

    public static void abortConnection(String uuid) {
        if (uuid == null) {
            return;
        }
        if (uuid.length() == 0) {
            return;
        }
        connectionStorage.remove(uuid);
    }

    public static void onHeartBeat(String uuid) {
        if (uuid == null) {
            return;
        }
        if (uuid.length() == 0) {
            return;
        }
        UserConnection connectionToRefreshHeartBeat = connectionStorage.get(uuid);
        if (connectionToRefreshHeartBeat == null) {
            return;
        }
        System.out.println("refreshing last heartbeat time for: " + uuid);
        connectionToRefreshHeartBeat.setLastHeartbeatTimestamp(Instant.now().toEpochMilli());
    }

    public static void sendMessage(String uuid, UserMessage userMessage) {
        if (uuid == null) {
            return;
        }
        if (uuid.length() == 0) {
            return;
        }
        UserConnection connectionToSend = connectionStorage.get(uuid);
        if (connectionToSend == null) {
            return;
        }
        System.out.println("sending message to: " + uuid);
        try {
            String data = UserMessage.toString(userMessage);
            connectionToSend.getSession().getAsyncRemote().sendText(data);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
