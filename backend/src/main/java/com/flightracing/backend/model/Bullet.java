package com.flightracing.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 子弹类
 */
public class Bullet {
    // 子弹x坐标
    private long x;
    // 子弹y坐标
    private long y;
    // 子弹z坐标
    private long z;

    // 子弹方向向量的x值
    @JsonProperty("direction_x")
    private double directionX;

    // 子弹方向向量的y值
    @JsonProperty("direction_y")
    private double directionY;

    // 子弹方向向量的z值
    @JsonProperty("direction_z")
    private double directionZ;

    // 子弹所属飞机的uuid
    private String uuid;

    public long getX() {
        return x;
    }

    public void setX(long x) {
        this.x = x;
    }

    public long getY() {
        return y;
    }

    public void setY(long y) {
        this.y = y;
    }

    public long getZ() {
        return z;
    }

    public void setZ(long z) {
        this.z = z;
    }

    public double getDirectionX() {
        return directionX;
    }

    public void setDirectionX(double directionX) {
        this.directionX = directionX;
    }

    public double getDirectionY() {
        return directionY;
    }

    public void setDirectionY(double directionY) {
        this.directionY = directionY;
    }

    public double getDirectionZ() {
        return directionZ;
    }

    public void setDirectionZ(double directionZ) {
        this.directionZ = directionZ;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}
