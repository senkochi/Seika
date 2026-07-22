package com.seika.marketplace_service.enums;

public enum OutboxStatus {
    PENDING,
    CLAIMED,
    SENT,
    FAILED,
    DEAD
}
