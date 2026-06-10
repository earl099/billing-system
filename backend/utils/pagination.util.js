/**
 * Pagination utility functions
 * Provides reusable pagination logic for list endpoints
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request query object
 * @param {number} defaultPage - Default page number (default: 1)
 * @param {number} defaultLimit - Default items per page (default: 10)
 * @param {number} maxLimit - Maximum allowed items per page (default: 100)
 * @returns {Object} { page, limit, skip }
 */
export function parsePaginationParams(query, defaultPage = 1, defaultLimit = 10, maxLimit = 100) {
    let page = parseInt(query.page) || defaultPage
    let limit = parseInt(query.limit) || defaultLimit

    // Validate page
    if (page < 1) page = 1

    // Validate and cap limit
    if (limit < 1) limit = 1
    if (limit > maxLimit) limit = maxLimit

    const skip = (page - 1) * limit

    return { page, limit, skip }
}

/**
 * Parse sort parameters from request query
 * @param {Object} query - Express request query object
 * @param {string} defaultSort - Default sort field (e.g., 'createdAt')
 * @param {string} defaultOrder - Default sort order ('asc' or 'desc', default: 'desc')
 * @returns {Object} { sortField, sortOrder, mongoSort }
 */
export function parseSortParams(query, defaultSort = 'createdAt', defaultOrder = 'desc') {
    const sortField = query.sort || defaultSort
    const sortOrder = query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc'
    
    // Prevent MongoDB injection - only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(sortField)) {
        return {
            sortField: defaultSort,
            sortOrder: defaultOrder,
            mongoSort: { [defaultSort]: defaultOrder === 'desc' ? -1 : 1 }
        }
    }

    return {
        sortField,
        sortOrder,
        mongoSort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
    }
}

/**
 * Build pagination response metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
export function buildPaginationMeta(total, page, limit) {
    const pages = Math.ceil(total / limit)
    
    return {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
        nextPage: page < pages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
    }
}

/**
 * Build complete paginated response
 * @param {Array} data - Array of items
 * @param {number} total - Total count
 * @param {Object} pagination - Pagination params { page, limit }
 * @returns {Object} { data, pagination }
 */
export function buildPaginatedResponse(data, total, pagination) {
    return {
        data,
        pagination: buildPaginationMeta(total, pagination.page, pagination.limit)
    }
}

/**
 * Filter parameters to only allow specific fields
 * Prevents information disclosure through query parameters
 * @param {Object} query - Query object
 * @param {Array} allowedFields - Array of allowed field names
 * @returns {Object} Filtered query
 */
export function filterQueryParams(query, allowedFields = []) {
    if (!allowedFields.length) return {}
    
    const filtered = {}
    for (const field of allowedFields) {
        if (query[field] !== undefined) {
            filtered[field] = query[field]
        }
    }
    return filtered
}
