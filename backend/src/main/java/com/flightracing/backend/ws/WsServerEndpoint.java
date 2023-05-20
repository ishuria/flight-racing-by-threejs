package com.flightracing.backend.ws;

import com.flightracing.backend.manager.ConnectionManager;
import com.flightracing.backend.model.UserConnection;
import com.flightracing.backend.model.UserMessage;
import com.flightracing.backend.task.MessageHandlerTask;
import org.springframework.stereotype.Component;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 定义WebSocket连接
 */
@ServerEndpoint("/ws")
@Component
public class WsServerEndpoint {

    private ExecutorService messageHandler = new ThreadPoolExecutor(Runtime.getRuntime().availableProcessors() * 2,
            Runtime.getRuntime().availableProcessors() * 2,
            100,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>()
    );



    /**
     * 连接成功
     * 下发uuid
     * 放入session管理器
     *
     * @param session
     */
    @OnOpen
    public void onOpen(Session session) {
        System.out.println("连接成功");
        UserConnection userConnection = new UserConnection();
        userConnection.setUuid(UUID.randomUUID().toString());
        userConnection.setSession(session);
        userConnection.setLastHeartbeatTimestamp(Instant.now().toEpochMilli());
        ConnectionManager.onConnected(userConnection);
    }

    /**
     * 连接关闭
     *
     * @param session
     */
    @OnClose
    public void onClose(Session session) {
        System.out.println("连接关闭");
        AtomicReference<String> removeUUID = new AtomicReference<>("");

        ConnectionManager.connectionStorage.forEach((uuid, c)->{
            if (c.getSession().getId().equals(session.getId())) {
                removeUUID.set(uuid);
            }
        });
        if (removeUUID.get().length() > 0){
            ConnectionManager.connectionStorage.remove(removeUUID.get());
        }
    }

    /**
     * 接收到消息
     *
     * @param text
     */
    @OnMessage
    public void onMsg(String text) {
        System.out.println("on message: " + text);
        try {
            UserMessage userMessage = UserMessage.fromString(text);
            messageHandler.submit(new MessageHandlerTask(userMessage));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}