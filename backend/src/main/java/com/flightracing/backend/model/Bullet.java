package com.flightracing.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Bullet {
    private long x;
    private long y;
    private long z;

    @JsonProperty("direction_x")
    private double directionX;
    @JsonProperty("direction_y")
    private double directionY;
    @JsonProperty("direction_z")
    private double directionZ;

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
