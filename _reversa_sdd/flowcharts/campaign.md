# Flowchart — campaign

## Position state machine (backend `Progress.report`, mirrored by the game `Campaign`)

```mermaid
stateDiagram-v2
    [*] --> Phase: chapter 1, stage 1, phase 1
    Phase --> Phase: CLEARED, phase < 5 (phase+1)
    Phase --> Miniboss: CLEARED, phase = 5
    Miniboss --> Phase: CLEARED, stage < 10 (stage+1, phase 1)
    Miniboss --> ChapterBoss: CLEARED, stage = 10
    Miniboss --> Phase: FAILED (phase 5 of same stage)
    ChapterBoss --> Phase: FAILED (stage 10, phase 5)
    ChapterBoss --> Phase: CLEARED, chapter < 5 (next chapter, stage 1)
    ChapterBoss --> Completed: CLEARED, chapter = 5
    Completed --> [*]
    note right of Phase
        FAILED on a phase, a report from
        another position, or any report
        when completed -> 409 PROGRESS_CONFLICT
        (body carries the stored progress)
    end note
```

## Outcome report (`POST /progress/outcome`)

```mermaid
flowchart TD
    A[outcome body] --> B{chapter/stage/phase Int ≥ 1,<br/>encounter and outcome known?}
    B -- no --> E1[400 PROGRESS_INVALID_OUTCOME]
    B -- yes --> C[lock progress, create if absent,<br/>open next chapter if completed]
    C --> D[Progress.report]
    D -- conflict --> E2[409 + stored progress]
    D -- ok --> F[save progress]
    F --> G{CLEARED?}
    G -- no --> R[response]
    G -- yes --> H{boss?}
    H -- yes --> I[lock player_cards]
    I --> J[CardRewards: miniboss 0.07·stage chance,<br/>chapter boss: first win 100%, else 80%;<br/>record clearedChapters + winsToday]
    J --> K[EquipmentRewards: roll piece,<br/>full bag sells it]
    H -- no --> T
    K --> T[talent award by key<br/>chapter:stage:encounter:phase,<br/>pays only the first time]
    T --> R
```

## Client report queue (`campaignSession`)

```mermaid
flowchart TD
    A[clear / fail] --> B[move position at once] --> Q[enqueue report]
    Q --> F[flush: one request at a time, in order]
    F -- 200 --> G[shift; fire talentPoints, drop, equipmentDrop]
    G --> H{queue empty, completed,<br/>answer is next chapter?}
    H -- yes --> N[adopt next chapter]
    F -- 409 --> R[adopt body.progress, void queue, onRealign]
    F -- other error --> K[keep report first, retry next tick]
```
