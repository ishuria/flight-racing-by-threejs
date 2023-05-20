package com.flightracing.backend.model;


import javax.websocket.Session;

/**
 * 玩家连接的实体类
 */
public class UserConnection {
    // 本链接的唯一标识符
    private String uuid;
    // 上一次成功的心跳时间戳
    private Long lastHeartbeatTimestamp;
    // 链接实例
    private Session session;

    private Player player = new Player();

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
        this.player.setUuid(uuid);
    }

    public Long getLastHeartbeatTimestamp() {
        return lastHeartbeatTimestamp;
    }

    public void setLastHeartbeatTimestamp(Long lastHeartbeatTimestamp) {
        this.lastHeartbeatTimestamp = lastHeartbeatTimestamp;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }
}
