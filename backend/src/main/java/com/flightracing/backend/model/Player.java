package com.flightracing.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 玩家类
 */
public class Player {
    // 玩家飞机的x坐标
    private long x;

    // 玩家飞机的y坐标
    private long y;

    // 玩家飞机的z坐标
    private long z;

    // 玩家飞机方向向量的x值
    @JsonProperty("look_at_x")
    private long lookAtX;

    // 玩家飞机方向向量的y值
    @JsonProperty("look_at_y")
    private long lookAtY;

    // 玩家飞机方向向量的z值
    @JsonProperty("look_at_z")
    private long lookAtZ;

    // 玩家飞机的uuid
    private String uuid;

    public long getX() {
        return x;
    }

    public void setX(long x) {
        this.x = x;
    }

    public long getZ() {
        return z;
    }

    public void setZ(long z) {
        this.z = z;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public long getY() {
        return y;
    }

    public void setY(long y) {
        this.y = y;
    }

    public long getLookAtX() {
        return lookAtX;
    }

    public void setLookAtX(long lookAtX) {
        this.lookAtX = lookAtX;
    }

    public long getLookAtY() {
        return lookAtY;
    }

    public void setLookAtY(long lookAtY) {
        this.lookAtY = lookAtY;
    }

    public long getLookAtZ() {
        return lookAtZ;
    }

    public void setLookAtZ(long lookAtZ) {
        this.lookAtZ = lookAtZ;
    }
}
