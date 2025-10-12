import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Star, DollarSign, User, Calendar, Paperclip, Code } from 'lucide-react';
import { format } from 'date-fns';

export default function PeerPointDetailModal({ peerPoint, isOpen, onClose, onSendRequest }) {
  
  if (!peerPoint) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">{peerPoint.title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-slate-500 pt-2">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>Requested by {peerPoint.requester}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(peerPoint.created_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <p className="text-slate-600 leading-relaxed">{peerPoint.description}</p>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">{peerPoint.type.replace(/_/g, ' ')}</Badge>
            <Badge variant="secondary">{peerPoint.status}</Badge>
            {peerPoint.bounty > 0 && (
              <div className="flex items-center gap-1 font-semibold text-emerald-600">
                <DollarSign className="w-4 h-4" />
                <span>{peerPoint.bounty} Bounty</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {peerPoint.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
              {peerPoint.file_url && (
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">Asset to Review:</span>
                  <a href={peerPoint.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    View Asset <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => onSendRequest(peerPoint)} disabled={peerPoint.status !== 'open'}>
            {peerPoint.status === 'open' ? 'Request to Review' : 'View Details'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}