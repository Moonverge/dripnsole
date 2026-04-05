import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/stores/auth.store'

interface Comment {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: string
  replies: Comment[]
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'cm1', userId: 'u3', userName: 'Miguel Santos',
    content: "What's the insole measurement on these?", createdAt: '2026-04-03T10:00:00Z',
    replies: [
      { id: 'cm1r1', userId: 'u1', userName: 'ThriftByKath', content: "It's 28cm!", createdAt: '2026-04-03T10:05:00Z', replies: [] },
    ],
  },
  {
    id: 'cm2', userId: 'u4', userName: 'Jessa Reyes',
    content: 'These are so clean 🔥', createdAt: '2026-04-02T15:00:00Z', replies: [],
  },
]

export default function CommentsSection({ listingId: _listingId }: { listingId: string }) {
  const user = useAuthStore((s) => s.user)
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  function handlePost() {
    if (!newComment.trim() || !user) return
    const comment: Comment = {
      id: 'cm-' + Date.now(), userId: user.id, userName: user.name,
      content: newComment, createdAt: new Date().toISOString(), replies: [],
    }
    setComments([comment, ...comments])
    setNewComment('')
  }

  function handleReply(parentId: string) {
    if (!replyText.trim() || !user) return
    const reply: Comment = {
      id: 'cm-' + Date.now(), userId: user.id, userName: user.name,
      content: replyText, createdAt: new Date().toISOString(), replies: [],
    }
    setComments(comments.map((c) =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c,
    ))
    setReplyingTo(null)
    setReplyText('')
  }

  return (
    <div>
      <h3 className="mb-4 font-martian text-base font-bold">Comments ({comments.length})</h3>

      {user && (
        <div className="mb-6 flex gap-3">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-border px-4 py-2.5 font-martian text-sm focus:border-brand focus:outline-none"
          />
          <button onClick={handlePost} className="cursor-pointer rounded-full bg-black px-4 py-2.5 font-martian text-sm text-white transition-colors hover:bg-brand">
            Post
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div key={comment.id}>
            <div className="rounded-xl bg-surface-light p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-martian text-xs font-bold">{comment.userName}</span>
                <span className="font-martian text-[10px] text-text-muted">{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mb-2 font-martian text-sm">{comment.content}</p>
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex cursor-pointer items-center gap-1 border-none bg-none font-martian text-xs text-text-muted hover:text-black">
                <Icon icon="mdi:reply" width={14} /> Reply
              </button>
            </div>

            {comment.replies.map((reply) => (
              <div key={reply.id} className="ml-8 mt-2 rounded-xl bg-surface-light/50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-martian text-xs font-bold">{reply.userName}</span>
                  <span className="font-martian text-[10px] text-text-muted">{new Date(reply.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-martian text-sm">{reply.content}</p>
              </div>
            ))}

            {replyingTo === comment.id && (
              <div className="ml-8 mt-2 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                  placeholder="Reply..."
                  className="flex-1 rounded-lg border border-border px-3 py-2 font-martian text-xs focus:border-brand focus:outline-none"
                  autoFocus
                />
                <button onClick={() => handleReply(comment.id)} className="cursor-pointer rounded-full bg-black px-3 py-2 font-martian text-xs text-white">Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
