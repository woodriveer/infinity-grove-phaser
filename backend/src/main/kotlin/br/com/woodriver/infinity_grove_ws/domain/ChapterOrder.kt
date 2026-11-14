package br.com.woodriver.infinity_grove_ws.domain

/**
 * The elements of the campaign's chapters. Chapter 1 is the starting element, chapter 2 the element it hits hardest, chapter 3 the
 * remaining one of fire, water and nature, then DARKNESS and LIGHT. From chapter 6 the same five elements repeat (AD-019). The hero of a
 * chapter is the hero of its element.
 */
object ChapterOrder {
    const val MAX_CHAPTER = 15

    /** Fire hits nature, nature hits water, water hits fire: the multiplier table of the `elements` feature. */
    private val hits = mapOf(Element.FIRE to Element.NATURE, Element.NATURE to Element.WATER, Element.WATER to Element.FIRE)

    /** The five chapter elements in chapter order; only FIRE, WATER and NATURE can start. */
    fun elements(start: Element): List<Element> {
        val second = hits[start] ?: throw InvalidStartingElementException(start.name)
        val third = hits.getValue(second)
        return listOf(start, second, third, Element.DARKNESS, Element.LIGHT)
    }

    fun element(
        start: Element,
        chapter: Int,
    ): Element {
        require(chapter in 1..MAX_CHAPTER) { "Chapter $chapter must be between 1 and $MAX_CHAPTER" }
        val order = elements(start)
        return order[(chapter - 1) % order.size]
    }

    fun chapterOf(
        start: Element,
        element: Element,
    ): Int = elements(start).indexOf(element) + 1
}
