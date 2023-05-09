package com.flightracing.backend.task;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.flightracing.backend.consts.Heartbeat;
import com.flightracing.backend.consts.MessageType;
import com.flightracing.backend.manager.ConnectionManager;
import com.flightracing.backend.model.Player;
import com.flightracing.backend.model.UserConnection;
import com.flightracing.backend.model.UserMessage;

import java.util.ArrayList;
import java.util.List;

public class MessageHandlerTask implements Runnable {
    private UserMessage userMessage;

    public MessageHandlerTask(UserMessage userMessage) {
        this.userMessage = userMessage;
    }

    @Override
    public void run() {
        switch (userMessage.getMessageType()) {
            case MessageType.HEARTBEAT: {
                if (Heartbeat.PONG.equals(userMessage.getText())) {
                    ConnectionManager.onHeartBeat(userMessage.getUuid());
                }
            }
            // 用户请求当前所有玩家坐标
            case MessageType.PLAYER: {

            }
            // 用户上报坐标
            case MessageType.POSITION: {
                if (userMessage.getUuid() == null) {
                    return;
                }
                if (userMessage.getUuid().length() == 0) {
                    return;
                }
                UserConnection connectionToSend = ConnectionManager.connectionStorage.get(userMessage.getUuid());
                if (connectionToSend == null) {
                    return;
                }

                try {
                    Player p = UserMessage.messageMapper.readValue(userMessage.getText(), Player.class);
                    connectionToSend.getPlayer().setX(p.getX());
                    connectionToSend.getPlayer().setY(p.getY());
                    connectionToSend.getPlayer().setZ(p.getZ());
                    connectionToSend.getPlayer().setLookAtX(p.getLookAtX());
                    connectionToSend.getPlayer().setLookAtY(p.getLookAtY());
                    connectionToSend.getPlayer().setLookAtZ(p.getLookAtZ());
                } catch (JsonProcessingException e) {
                    e.printStackTrace();
                }
                // 需要给所有链接的用户下发坐标
                UserMessage playerMessage = new UserMessage(MessageType.PLAYER);
                playerMessage.setUuid(userMessage.getUuid());
                List<Player> players = new ArrayList<>();
                ConnectionManager.connectionStorage.forEach((uuid, c) -> {
                    players.add(c.getPlayer());
                });

                ConnectionManager.connectionStorage.forEach((uuid, c) -> {
                    try {
                        playerMessage.setText(UserMessage.messageMapper.writeValueAsString(players));
                        ConnectionManager.sendMessage(uuid, playerMessage);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            }
            default:
        }
    }
}
