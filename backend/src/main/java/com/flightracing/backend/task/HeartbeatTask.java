package com.flightracing.backend.task;

import com.flightracing.backend.consts.Heartbeat;
import com.flightracing.backend.manager.ConnectionManager;
import com.flightracing.backend.model.UserMessage;

import javax.websocket.Session;
import java.util.ArrayList;
import java.util.List;

/**
 * 健康检查定时任务
 */
public class HeartbeatTask implements Runnable {

    @Override
    public void run() {
        System.out.println("HeartbeatTask invoked");
        List<String> failureList = new ArrayList<>();
        ConnectionManager.connectionStorage.values().forEach(c -> {
            System.out.println("checking connection: " + c.getUuid());
            Session s = c.getSession();
            if (s == null) {
                System.out.println("session is null");
                return;
            }
            UserMessage userMessage = new UserMessage();
            userMessage.setMessageType(Heartbeat.PING);
            userMessage.setUuid(c.getUuid());
            try {
                s.getAsyncRemote().sendText(UserMessage.toString(userMessage));
            } catch (Exception e) {
                e.printStackTrace();
                failureList.add(c.getUuid());
            }
        });
        failureList.forEach(uuid -> {
            ConnectionManager.connectionStorage.remove(uuid);
        });
    }
}
