package com.flightracing.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Bullet {
    private long x;
    private long y;
    private long z;

    @JsonProperty("direction_x")
    private long directionX;
    @JsonProperty("direction_y")
    private long directionY;
    @JsonProperty("direction_z")
    private long directionZ;

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

    public long getDirectionX() {
        return directionX;
    }

    public void setDirectionX(long directionX) {
        this.directionX = directionX;
    }

    public long getDirectionY() {
        return directionY;
    }

    public void setDirectionY(long directionY) {
        this.directionY = directionY;
    }

    public long getDirectionZ() {
        return directionZ;
    }

    public void setDirectionZ(long directionZ) {
        this.directionZ = directionZ;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}
