package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.domain.Element.DARKNESS
import br.com.woodriver.infinity_grove_ws.domain.Element.FIRE
import br.com.woodriver.infinity_grove_ws.domain.Element.LIGHT
import br.com.woodriver.infinity_grove_ws.domain.Element.NATURE
import br.com.woodriver.infinity_grove_ws.domain.Element.WATER
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ChapterOrderTest {
    @Test
    fun `a fire start gives fire, nature, water, darkness, light`() {
        assertEquals(listOf(FIRE, NATURE, WATER, DARKNESS, LIGHT), ChapterOrder.elements(FIRE))
    }

    @Test
    fun `a nature start gives nature, water, fire, darkness, light`() {
        assertEquals(listOf(NATURE, WATER, FIRE, DARKNESS, LIGHT), ChapterOrder.elements(NATURE))
    }

    @Test
    fun `a water start gives water, fire, nature, darkness, light`() {
        assertEquals(listOf(WATER, FIRE, NATURE, DARKNESS, LIGHT), ChapterOrder.elements(WATER))
    }

    @Test
    fun `light and darkness cannot start`() {
        assertFailsWith<InvalidStartingElementException> { ChapterOrder.elements(LIGHT) }
        assertFailsWith<InvalidStartingElementException> { ChapterOrder.elements(DARKNESS) }
    }

    @Test
    fun `the element of a chapter follows the order`() {
        assertEquals(FIRE, ChapterOrder.element(FIRE, 1))
        assertEquals(NATURE, ChapterOrder.element(FIRE, 2))
        assertEquals(WATER, ChapterOrder.element(FIRE, 3))
        assertEquals(DARKNESS, ChapterOrder.element(FIRE, 4))
        assertEquals(LIGHT, ChapterOrder.element(FIRE, 5))
    }

    @Test
    fun `a chapter outside 1 to 5 is rejected`() {
        assertFailsWith<IllegalArgumentException> { ChapterOrder.element(FIRE, 0) }
        assertFailsWith<IllegalArgumentException> { ChapterOrder.element(FIRE, 6) }
    }

    @Test
    fun `the chapter of an element depends on the starting element`() {
        assertEquals(1, ChapterOrder.chapterOf(WATER, WATER))
        assertEquals(2, ChapterOrder.chapterOf(WATER, FIRE))
        assertEquals(3, ChapterOrder.chapterOf(WATER, NATURE))
        assertEquals(3, ChapterOrder.chapterOf(FIRE, WATER))
        assertEquals(5, ChapterOrder.chapterOf(NATURE, LIGHT))
    }
}
