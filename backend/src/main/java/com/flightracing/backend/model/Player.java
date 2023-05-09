package com.flightracing.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Player {
    private long x;
    private long y;
    private long z;

    @JsonProperty("look_at_x")
    private long lookAtX;
    @JsonProperty("look_at_y")
    private long lookAtY;
    @JsonProperty("look_at_z")
    private long lookAtZ;

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
