/**
 * Represents a custom API error.
 *
 * Step 1: Extend the built-in Error class.
 * Step 2: Store custom HTTP status code.
 * Step 3: Set a default error message if none is provided.
 * Step 4: Keep track of any detailed errors in an array.
 * Step 5: Optionally accept a pre-defined stack trace.
 *
 * @class ApiError
 * @extends Error
 * @param {number} statusCode - HTTP status code representing the error.
 * @param {string} [message="Something went wrong"] - Descriptive error message.
 * @param {Array} [errors=[]] - Array of additional error details.
 * @param {string} [stack=""] - Optional custom stack trace.
 */
class ApiError extends Error {
    constructor(
        statusCode,
        // data = null,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}