import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 15

/**
 * POST /api/projects/invite
 * Body: { projectId: string, email: string }
 * Invites a Bloom user by email to collaborate on a project.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { projectId, email } = body
  if (!projectId || !email) {
    return NextResponse.json({ error: 'projectId and email required' }, { status: 400 })
  }

  // Call the SECURITY DEFINER RPC
  const { data, error } = await supabase.rpc('invite_project_collaborator', {
    p_project_id: projectId,
    p_email: email,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (data?.ok === false) {
    const reasons: Record<string, string> = {
      no_such_user: "Aucun utilisateur Bloom avec cet email. La personne doit d'abord créer un compte.",
      cant_invite_self: 'Tu ne peux pas t\'inviter toi-même.',
      not_owner: 'Tu n\'es pas le propriétaire de ce projet.',
      already_invited: 'Cette personne a déjà été invitée à ce projet.',
    }
    return NextResponse.json({ error: reasons[data.error] || data.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, inviteId: data.invite_id })
}
