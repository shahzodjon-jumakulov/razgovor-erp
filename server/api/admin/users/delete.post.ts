import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('Delete user API called')
  try {
    // Get the user ID from the request body
    const body = await readBody(event)
    console.log('Request body:', body)
    const { userId } = body

    if (!userId) {
      console.log('No userId provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('Attempting to delete user:', userId)

    // Create admin client using service role key
    const supabaseAdmin = serverSupabaseServiceRole(event)

    // Then delete from Supabase auth using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to delete user from auth: ${authError.message}`
      })
    }

    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error?.statusCode) {
      throw error
    }

    // Otherwise, create a generic server error
    throw createError({
      statusCode: 500,
      statusMessage: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
