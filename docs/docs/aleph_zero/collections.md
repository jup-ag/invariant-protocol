---
title: Collections

slug: /aleph_zero/collections
---

This segment explores key storage structures that manage various entities within the Invariant protocol. These collections play a crucial role in organizing and managing data in a structured manner, enhancing the overall functionality and performance of our contract. Within our collection interface, we enforce a tightly defined set of operations available for all data collections. Each collection implements the same basic methods, allowing for consistent data management regardless of the underlying data structures (vectors or mappings).

## Positions

```rust
#[ink::storage_item]
#[derive(Debug, Default)]
pub struct Positions {
    positions_length: Mapping<AccountId, u32>,
    positions: Mapping<(AccountId, u32), Position>,
}
```

| Key                       | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Unique account identifier | A tuple containing the number of positions (u32) and a vector of `Position` objects |

The `Positions` struct is designed to manage positions associated with different accounts. It uses a mapping data structure, where each account is uniquely identified by its `AccountId`, and a tuple containing the number of positions and a vector of positions is stored as the associated value. The provided functions allow you to add, update, remove, transfer, and retrieve positions associated with specific accounts.

This documentation should help users understand the purpose of the `Positions` struct and how to use its functions effectively.

**Why Positions are Stored in State Instead of NFTs?**

We have chosen to store positions in the state rather than using NFTs for several reasons:

1. **Efficient Search Operations**: One primary advantage is the enhanced efficiency in searching for and accessing specified positions. Independence from blockchain token indexers distinguishes this approach. Unlike the alternative, where determining a user's position may require iterating through all available NFTs, storing positions in the state streamlines the process of retrieving and managing positions for specific accounts. This makes it a more optimal choice when precision and speed are crucial.

2. **Gas Cost Optimization**: Iterating through NFTs can pose challenges and inefficiencies, particularly with a substantial number of unique tokens. Storing positions in the state not only simplifies management and access but also proves to be more cost-effective in terms of gas fees and overall contract execution, leading to improved gas cost optimization. Unlike NFTs, which may incur additional costs for minting, transferring, and managing unique tokens, the state-based approach offers a more streamlined and economical solution.

3. **Data Integrity and Recovery**: In scenarios where accidental deletion or burning of NFTs may occur, the state-based approach ensures the preservation of critical position data. This safeguards against potential data loss, offering an added layer of security and resilience to unforeseen circumstances.

### Functions within the `Positions` Struct

```rust
    pub fn add(&mut self, account_id: AccountId, position: Position) {}
```

- **Description**: Adds a new position to the specified account.
- **Parameters**: `account_id` (AccountId), `position` (Position)
- **Edge Cases**: None

```rust
    pub fn update(
        &mut self,
        account_id: AccountId,
        index: u32,
        position: &Position,
    ) -> Result<(), InvariantError> {}
```

- **Description**: Updates an existing position at a specific index for the specified account.
- **Parameters**: `account_id` (AccountId), `index` (u32), `position` (Position)
- **Edge Cases**: Returns an error if the specified index is out of bounds.

```rust
    pub fn remove(
        &mut self,
        account_id: AccountId,
        index: u32,
    ) -> Result<Position, InvariantError> {}
```

- **Description**: Removes a position at a specific index for the specified account.
- **Parameters**: `account_id` (AccountId), `index` (u32)
- **Edge Cases**: Returns an error if the specified index is out of bounds.

```rust
    pub fn transfer(
        &mut self,
        account_id: AccountId,
        index: u32,
        receiver: AccountId,
    ) -> Result<(), InvariantError> {}
```

- **Description**: Transfers a position from one account to another.
- **Parameters**: `account_id` (AccountId), `index` (u32), `receiver` (AccountId)
- **Edge Cases**: Returns an error if the position does not exist.

```rust
    pub fn get_all(&self, account_id: AccountId) -> Vec<Position> {}
```

- **Description**: Retrieves all positions associated with the specified account.
- **Parameters**: `account_id` (AccountId)
- **Edge Cases**: None

```rust
    pub fn get(&mut self, account_id: AccountId, index: u32) -> Option<Position> {}
```

- **Description**: Retrieves a position at a specific index for the specified account.
- **Parameters**: `account_id` (AccountId), `index` (u32)
- **Edge Cases**: Returns `None` if the specified index is out of bounds.

```rust
    fn get_length(&self, account_id: AccountId) -> u32 {}
```

- **Description**: Retrieves the number of positions associated with the specified account.
- **Parameters**: `account_id` (AccountId)
- **Edge Cases**: None

## Ticks

```rust
#[ink::storage_item]
#[derive(Debug, Default)]
pub struct Ticks {
    ticks: Mapping<(PoolKey, i32), Tick>,
}

```

| Key                                                                          | Value                                   |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| A tuple of `PoolKey` and `i32` values, uniquely identifying a specific tick. | A `Tick` object associated with the key |

The Ticks struct is designed to manage ticks associated between different pools. It uses a mapping data structure, where each tick is identified by a tuple of PoolKey and i32 (tick index), and a Tick object is stored as the associated value. The provided functions allow you to retrieve, add, update, and remove ticks associated with specific PoolKey values.

### Functions within the `Ticks` Struct

```rust
pub fn get(&self, key: PoolKey, index: i32) -> Result<Tick, InvariantError> {}
```

- **Description**: Retrieves a Tick object associated with a specific PoolKey and index.
- **Parameters**: key (PoolKey), index (i32)
- **Edge Cases**: Return an error if specified tick cannot be found

```rust
pub fn remove(&mut self, key: PoolKey, index: i32) -> Result<(), InvariantError> {}
```

- **Description**: Removes a tick associated with a specific PoolKey and index.
- **Parameters**: key (PoolKey), index (i32)
- **Edge Cases**: Returns an error if the specified tick does not exist.

```rust
pub fn add(&mut self, key: PoolKey, index: i32, tick: &Tick) -> Result<(), InvariantError> {}
```

- **Description**: Adds a new tick associated with a specific PoolKey and index.
- **Parameters**: key (PoolKey), index (i32), tick (Tick)
- **Edge Cases**: Returns an error if tick already exist.

```rust
pub fn update(
    &mut self,
    key: PoolKey,
    index: i32,
    tick: &Tick,
) -> Result<(), InvariantError> {}
```

- **Description**: Updates an existing tick associated with a specific PoolKey and index.
- **Parameters**: key (PoolKey), index (i32), tick: (&Tick)
- **Edge Cases**: Returns an error if the specified tick does not exist.

## Pools

```rust

#[ink::storage_item]
#[derive(Debug, Default)]
pub struct Pools {
    pools: Mapping<PoolKey, Pool>,
}
```

| Key                            | Value                                   |
| ------------------------------ | --------------------------------------- |
| A unique identifier for a pool | A `Pool` object associated with the key |

The `Pools` struct is designed to manage pools associated with different `PoolKey` values. It uses a mapping data structure, where each pool is identified by a unique `PoolKey`, and a `Pool` object is stored as the associated value. The provided functions allow you to add, retrieve, update, and remove pools associated with specific `PoolKey` values.

### Functions within the `Pools` Struct

```rust
    pub fn add(&mut self, pool_key: PoolKey, pool: &Pool) -> Result<(), InvariantError> {}
```

- **Description**: Adds a new pool associated with the specified `PoolKey`.
- **Parameters**: `pool_key` (PoolKey), `pool` (Pool)
- **Edge Cases**: Returns an error if a pool with the same `PoolKey` already exists.

```rust
    pub fn get(&self, pool_key: PoolKey) -> Result<Pool, InvariantError> {}
```

- **Description**: Retrieves a pool associated with the specified `PoolKey`.
- **Parameters**: `pool_key` (PoolKey)
- **Edge Cases**: Returns an error if the specified pool does not exist.

```rust
    pub fn update(&mut self, pool_key: PoolKey, pool: &Pool) -> Result<(), InvariantError> {}
```

- **Description**: Updates an existing pool associated with the specified `PoolKey`.
- **Parameters**: `pool_key` (PoolKey), `pool` (Pool)
- **Edge Cases**: Returns an error if the specified pool does not exist.

```rust
    pub fn remove(&mut self, pool_key: PoolKey) -> Result<(), InvariantError> {}
```

- **Description**: Removes a pool associated with the specified `PoolKey`.
- **Parameters**: `pool_key` (PoolKey)
- **Edge Cases**: Returns an error if the specified pool does not exist.

## Fee Tiers

```rust
#[ink::storage_item]
#[derive(Debug, Default)]
pub struct FeeTiers {
    fee_tiers: Vec<FeeTier>,
}
```

The `FeeTiers` struct is designed to manage fee tiers. It utilizes a vector (Vec) data structure, where each element corresponds to a different fee tier represented by a `FeeTier` object. The provided functions allow you to add, retrieve, update, and remove fee tiers within the collection. Each fee tier is uniquely identified within the vector, and you can perform operations on these fee tiers based on their positions in the vector.

### Functions within the `FeeTiers` Struct

```rust
    pub fn get_all(&self) -> Vec<FeeTier> {}
```

- **Description**: Retrieves a all fee tiers.
- **Parameters**: `key` (FeeTier)
- **Edge Cases**: None

```rust
    pub fn contains(&self, key: FeeTier) -> bool {}
```

- **Description**: Verifies if specified `FeeTier` exist.
- **Parameters**: `key` (FeeTier)
- **Edge Cases**: None

```rust
    pub fn add(&mut self, key: FeeTier) -> Result<(), InvariantError> {}
```

- **Description**: Adds a new fee tier associated with the specified `FeeTier`.
- **Parameters**: `key` (FeeTier)
- **Edge Cases**: Returns an error if fee tier already exist

```rust
    pub fn remove(&mut self, key: FeeTier) -> Result<(), InvariantError> {}
```

- **Description**: Removes a fee tier associated with the specified `FeeTier`.
- **Parameters**: `key` (FeeTier)
- **Edge Cases**: Returns an error if fee tier cannot be found

## Pool Keys

```rust
#[ink::storage_item]
#[derive(Debug, Default)]
pub struct PoolKeys {
    pool_keys: Vec<PoolKey>,
}
```

The `PoolKeys` struct is designed to manage pool keys. It utilizes a vector (Vec) data structure, where each element corresponds to a different pool key represented by a `PoolKey` object. The provided functions allow you to add, retrieve, update, and remove pool keys within the collection. Each pool key is uniquely identified within the vector, and you can perform operations on these pool keys based on their positions in the vector.

### Functions within the `PoolKeys` Struct

```rust
    pub fn get_all(&self) -> Vec<FeeTier> {}
```

- **Description**: Retrieves all pool keys.
- **Parameters**: `pool_key` (PoolKey)
- **Edge Cases**: None

```rust
    pub fn contains(&self, pool_key: PoolKey) -> bool {}
```

- **Description**: Verifies if specified `PoolKey` exist.
- **Parameters**: `pool_key` (PoolKey)
- **Edge Cases**: None

```rust
    pub fn add(&mut self, pool_key: PoolKey) -> Result<(), InvariantError> {}
```

- **Description**: Adds a new pool key associated with the specified `PoolKey`.
- **Parameters**: `pool_key` (PoolKey)
- **Edge Cases**: Returns an error if pool key already exist

```rust
    pub fn remove(&mut self, pool_key: PoolKey) -> Result<(), InvariantError> {}
```

- **Description**: Removes a pool key associated with the specified `PoolKey`.
- **Parameters**: `pool_key` (PoolKey)
- **Edge Cases**: Returns an error if pool key cannot be found