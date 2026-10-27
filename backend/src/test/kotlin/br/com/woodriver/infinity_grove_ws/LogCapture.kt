package br.com.woodriver.infinity_grove_ws

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import org.slf4j.LoggerFactory

/** Collects what one class logs at INFO or above while the test runs; call [close] to detach. */
class LogCapture(
    type: Class<*>,
) : AutoCloseable {
    private val logger = LoggerFactory.getLogger(type) as Logger
    private val appender = ListAppender<ILoggingEvent>().also { it.start() }
    private val previousLevel = logger.level

    init {
        logger.level = Level.INFO
        logger.addAppender(appender)
    }

    /** The formatted INFO messages in the order they were logged. */
    val infos get() = appender.list.filter { it.level == Level.INFO }.map { it.formattedMessage }

    /** The formatted WARN messages in the order they were logged. */
    val warns get() = appender.list.filter { it.level == Level.WARN }.map { it.formattedMessage }

    override fun close() {
        logger.detachAppender(appender)
        logger.level = previousLevel
    }
}
